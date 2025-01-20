from datetime import datetime, date, time, timedelta
from os import name
from typing import Dict, List
from python.db.dao import DailyGameTimeWithLastSessionsDto, Dao
from python.helpers import format_date, parse_date_with_hours
from python.models import (
    DayStatistics,
    Game,
    GameWithTime,
    OverallGameTimeDto,
    PagedDayStatistics,
    PagedYearStatistics,
    YearlyStatistics,
)
import logging

logger = logging.getLogger()


class Statistics:
    dao: Dao

    def __init__(self, dao: Dao) -> None:
        self.dao = dao

    def daily_statistics_for_period(self, start: date, end: date) -> PagedDayStatistics:
        start_time = datetime.combine(start, time(00, 00, 00))
        end_time = datetime.combine(end, time(23, 59, 59, 999999))
        data = self.dao.fetch_per_day_time_report(start_time, end_time)

        data_as_dict: Dict[str, List[DailyGameTimeWithLastSessionsDto]] = {}

        for it in data:
            if it.date in data_as_dict:
                data_as_dict[it.date].append(it)
            else:
                data_as_dict[it.date] = [it]

        result: List[DayStatistics] = []
        date_range = self._generate_date_range(start, end)

        for day in date_range:
            date_str = format_date(day)

            if date_str in data_as_dict:
                games: List[Game] = []
                total_time = 0

                for el in data_as_dict[date_str]:
                    games.append(
                        GameWithTime(
                            Game(el.game_id, el.game_name),
                            el.time,
                            el.total_sessions,
                            el.last_play_time_date,
                            el.last_play_duration_time,
                        )
                    )
                    total_time += el.time

                result.append(
                    DayStatistics(
                        date=date_str,
                        games=games,
                        total=total_time,
                    )
                )
            else:
                result.append(DayStatistics(date_str, [], 0))

        return PagedDayStatistics(
            data=result,
            hasPrev=self.dao.is_there_is_data_before(start_time),
            hasNext=self.dao.is_there_is_data_after(end_time),
        )

    def game_statics_per_year(self, game_id: int, year: int) -> PagedYearStatistics:
        year_time_report = self.dao.fetch_per_year_time_report(game_id, year)

        months_list = [
            "Jan",
            "Feb",
            "Mar",
            "Apr",
            "May",
            "Jun",
            "Jul",
            "Aug",
            "Sep",
            "Oct",
            "Nov",
            "Dec",
        ]
        stats_by_month: List[YearlyStatistics] = []

        for index, month_name in enumerate(months_list):
            current_month_index = index + 1
            statistics_for_month = []
            total_duration = 0
            total_sessions = 0

            for statistics in year_time_report:
                month_of_stat = parse_date_with_hours(statistics.date).month

                if month_of_stat != current_month_index:
                    continue

                statistics_for_month.append(statistics)
                total_duration += float(statistics.duration)
                total_sessions += 1

            stats_by_month.append(
                {
                    "month": current_month_index,
                    "month_name": month_name,
                    "total": total_duration,
                    "sessions_count": total_sessions,
                    "sessions": statistics_for_month,
                }
            )

        return PagedYearStatistics(
            data=stats_by_month,
            hasNext=self.dao.has_game_any_data_in_year(game_id, year + 1),
            hasPrev=self.dao.has_game_any_data_in_year(game_id, year - 1),
        )

    def per_game_overall_statistic(self) -> List[GameWithTime]:
        data = self.dao.fetch_overall_playtime()
        result: List[GameWithTime] = []

        for g in data:
            result.append(
                {
                    "game": {"id": g.game_id, "name": g.game_name},
                    "time": g.time,
                    "total_sessions": g.total_sessions,
                    "last_play_time_date": g.last_play_time_date,
                    "last_play_duration_time": g.last_play_duration_time,
                }
            )
        return result

    def get_game(self, game_id: int) -> OverallGameTimeDto:
        response = self.dao.get_game(game_id)

        return OverallGameTimeDto(id=response[0], name=response[1], time=response[2])

    def _generate_date_range(self, start_date, end_date):
        date_list = []
        curr_date = start_date

        while curr_date <= end_date:
            date_list.append(curr_date)
            curr_date += timedelta(days=1)
        return date_list
