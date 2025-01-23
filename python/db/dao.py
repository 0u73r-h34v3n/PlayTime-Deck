from dataclasses import dataclass
import datetime
import logging
import sqlite3
from typing import List

from python.db.sqlite_db import SqlLiteDb
from python.helpers import format_date, parse_date, parse_date_with_hours

logger = logging.getLogger()


@dataclass
class OverallGamesTimeDto:
    game_id: str
    game_name: str
    last_play_duration_time: float
    last_play_time_date: str
    time: int
    total_sessions: int


@dataclass
class DailyGameTimeDto:
    date: str
    game_id: str
    game_name: str
    time: int


@dataclass
class DailyGameTimeWithLastSessionsDto:
    date: str
    game_id: str
    game_name: str
    time: int
    total_sessions: int
    last_play_time_date: str
    last_play_duration_time: float


@dataclass
class GameSessionsTimeDto:
    date: str
    duration: float
    migrated: str | None


@dataclass
class OverallGameTimeDto:
    id: str
    name: str
    time: float


@dataclass
class LastPlaytiomeSessionInformationDto:
    game_id: str
    date_time: str
    duration: float


class Dao:
    def __init__(self, db: SqlLiteDb):
        self._db = db

    def save_game_dict(self, game_id: str, game_name: str) -> None:
        with self._db.transactional() as connection:
            self._save_game_dict(connection, game_id, game_name)

    def save_play_time(
        self, start: datetime.datetime, time_s: int, game_id: str, source: str = None
    ) -> None:
        with self._db.transactional() as connection:
            self._save_play_time(connection, start, time_s, game_id, source)

    def apply_manual_time_for_game(
        self,
        create_at: datetime.datetime,
        game_id: str,
        game_name: str,
        new_overall_time: int,
        source: str,
    ) -> None:
        with self._db.transactional() as connection:
            self._save_game_dict(connection, game_id, game_name)
            current_time = connection.execute(
                "SELECT sum(duration) FROM play_time WHERE game_id = ?", (game_id,)
            ).fetchone()[0]
            delta_time = new_overall_time - (
                current_time if current_time is not None else 0
            )
            if delta_time != 0:
                self._save_play_time(connection, create_at, delta_time, game_id, source)

    def fetch_per_day_time_report(
        self, begin: type[datetime.datetime], end: type[datetime.datetime]
    ) -> List[DailyGameTimeWithLastSessionsDto]:
        with self._db.transactional() as connection:
            per_day_time_report = self._fetch_per_day_time_report(
                connection, begin, end
            )
            response: List[DailyGameTimeWithLastSessionsDto] = []

            for it in per_day_time_report:
                date = format_date(parse_date(it.date.split("T", 1)[0])).split("T", 1)[
                    0
                ]

                game = next((x for x in response if x.game_id == it.game_id), None)

                last_playtime_session_information = (
                    self.fetch_last_playtime_session_information(it.game_id)
                )

                if game:
                    current_game_date = parse_date(game.date)
                    new_game_date = parse_date_with_hours(it.date)

                    if current_game_date.day != new_game_date.day:
                        response.append(
                            DailyGameTimeWithLastSessionsDto(
                                date,
                                it.game_id,
                                it.game_name,
                                it.time,
                                1,
                                last_playtime_session_information[1],
                                last_playtime_session_information[2],
                            )
                        )
                    else:
                        game.time += it.time
                        game.total_sessions += 1
                else:
                    response.append(
                        DailyGameTimeWithLastSessionsDto(
                            date,
                            it.game_id,
                            it.game_name,
                            it.time,
                            1,
                            last_playtime_session_information[1],
                            last_playtime_session_information[2],
                        )
                    )

            return response

    def is_there_is_data_before(self, date: type[datetime.datetime]) -> bool:
        with self._db.transactional() as connection:
            return self._is_there_is_data_before(connection, date)

    def is_there_is_data_after(self, date: type[datetime.datetime]) -> bool:
        with self._db.transactional() as connection:
            return self._is_there_is_data_after(connection, date)

    def _is_there_is_data_before(
        self, connection: sqlite3.Connection, date: type[datetime.datetime]
    ) -> bool:
        return (
            connection.execute(
                """
                SELECT count(1) FROM play_time
                WHERE date_time < ?
            """,
                (date.isoformat(),),
            ).fetchone()[0]
            > 0
        )

    def _is_there_is_data_after(
        self, connection: sqlite3.Connection, date: type[datetime.datetime]
    ) -> bool:
        return (
            connection.execute(
                """
                SELECT count(1) FROM play_time
                WHERE date_time > ?
            """,
                (date.isoformat(),),
            ).fetchone()[0]
            > 0
        )

    def _save_game_dict(
        self, connection: sqlite3.Connection, game_id: str, game_name: str
    ):
        connection.execute(
            """
                INSERT INTO game_dict (game_id, name)
                VALUES (:game_id, :game_name)
                ON CONFLICT (game_id) DO UPDATE SET name = :game_name
                WHERE name != :game_name
            """,
            {"game_id": game_id, "game_name": game_name},
        )

    def fetch_overall_playtime(self) -> List[OverallGamesTimeDto]:
        with self._db.transactional() as connection:
            return self._fetch_overall_playtime(connection)

    def _save_play_time(
        self,
        connection: sqlite3.Connection,
        start: datetime.datetime,
        time_s: int,
        game_id: str,
        source: str = None,
    ):
        connection.execute(
            """
                INSERT INTO play_time(date_time, duration, game_id, migrated)
                VALUES (?,?,?,?)
            """,
            (start.isoformat(), time_s, game_id, source),
        )
        self._append_overall_time(connection, game_id, time_s)

    def _append_overall_time(
        self, connection: sqlite3.Connection, game_id: str, delta_time_s: int
    ):
        connection.execute(
            """
                INSERT INTO overall_time (game_id, duration)
                VALUES (:game_id, :delta_time_s)
                ON CONFLICT (game_id)
                    DO UPDATE SET duration = duration + :delta_time_s
            """,
            {"game_id": game_id, "delta_time_s": delta_time_s},
        )

    def _fetch_overall_playtime(
        self,
        connection: sqlite3.Connection,
    ) -> List[OverallGamesTimeDto]:
        connection.row_factory = lambda c, row: OverallGamesTimeDto(
            game_id=row[0],
            game_name=row[1],
            time=row[2],
            total_sessions=row[3],
            last_play_time_date=row[4],
            last_play_duration_time=row[5],
        )
        return connection.execute(
            """
            SELECT
                ot.game_id,
                gd.name AS game_name,
                ot.duration,
                COUNT(pt.game_id) AS sessions,
                MAX(pt.date_time) AS last_play_time,
                MAX(pt.duration) AS last_duration_time
            FROM
                overall_time ot
            JOIN
                game_dict gd ON ot.game_id = gd.game_id
            JOIN
                play_time pt ON ot.game_id = pt.game_id
            GROUP BY
                ot.game_id, gd.name, ot.duration
            """
        ).fetchall()

    def _fetch_per_day_time_report(
        self,
        connection: sqlite3.Connection,
        begin: type[datetime.datetime],
        end: type[datetime.datetime],
    ) -> List[DailyGameTimeDto]:
        connection.row_factory = lambda c, row: DailyGameTimeDto(
            date=row[0], game_id=row[1], game_name=row[2], time=row[3]
        )
        result = connection.execute(
            """
            SELECT
                pt.date_time as date,
                pt.game_id as game_id,
                gd.name as game_name,
                pt.duration as duration
            FROM
                play_time pt
            LEFT JOIN
                game_dict gd
            ON
                pt.game_id = gd.game_id
            WHERE
                STRFTIME('%s', date_time)
            BETWEEN
                STRFTIME('%s', :begin)
            AND
                STRFTIME('%s', :end)
            """,
            {"begin": begin.isoformat(), "end": end.isoformat()},
        ).fetchall()
        return result

    def fetch_per_year_time_report(
        self,
        game_id: int,
        year: int,
    ) -> List[GameSessionsTimeDto]:
        with self._db.transactional() as connection:
            return self._fetch_per_year_time_report(
                connection,
                game_id,
                year,
            )

    def _fetch_per_year_time_report(
        self,
        connection: sqlite3.Connection,
        game_id: int,
        year: int,
    ) -> List[GameSessionsTimeDto]:
        connection.row_factory = lambda c, row: GameSessionsTimeDto(
            date=row[0], duration=row[1], migrated=row[2]
        )

        result = connection.execute(
            """
            SELECT
                date_time,
                duration,
                migrated
            FROM
                play_time pt
            WHERE
                pt.game_id = ?
            AND
                strftime('%Y', date_time) = ?
            """,
            (game_id, str(year)),
        ).fetchall()

        return result

    def has_game_any_data_in_year(self, game_id: int, year: int) -> bool:
        with self._db.transactional() as connection:
            return self._has_game_any_data_in_year(connection, game_id, year)

    def _has_game_any_data_in_year(
        self, connection: sqlite3.Connection, game_id: int, year: int
    ) -> bool:
        return (
            connection.execute(
                """
                SELECT
                    COUNT(*) AS total_entries
                FROM
                    play_time pt
                WHERE
                    game_id = ?
                AND
                    strftime('%Y', date_time) = ?
                """,
                (game_id, str(year)),
            ).fetchone()[0]
            > 0
        )

    def get_game(self, game_id: int) -> OverallGameTimeDto:
        with self._db.transactional() as connection:
            return self._get_game(connection, game_id)

    def _get_game(
        self, connection: sqlite3.Connection, game_id: int
    ) -> OverallGameTimeDto:
        return connection.execute(
            """
            SELECT
                gd.game_id,
                gd.name,
                ot.duration
            FROM
                game_dict gd
            INNER JOIN overall_time ot
                ON gd.game_id = ot.game_id
            WHERE
                gd.game_id = ?
            """,
            (game_id,),
        ).fetchone()

    def fetch_last_playtime_session_information(
        self, game_id: int
    ) -> LastPlaytiomeSessionInformationDto:
        with self._db.transactional() as connection:
            return self._fetch_last_playtime_session_information(connection, game_id)

    def _fetch_last_playtime_session_information(
        self, connection: sqlite3.Connection, game_id: int
    ) -> LastPlaytiomeSessionInformationDto:
        return connection.execute(
            """
            SELECT
                pt.game_id,
                pt.date_time,
                pt.duration
            FROM
                play_time pt
            WHERE
                pt.game_id = ?
            ORDER BY
                pt.date_time
            DESC LIMIT 1;
            """,
            (game_id,),
        ).fetchone()
