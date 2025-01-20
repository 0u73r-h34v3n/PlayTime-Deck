from dataclasses import dataclass
from typing import List


@dataclass
class Game:
    id: str
    name: str


@dataclass
class GameWithTime:
    game: Game
    time: int
    total_sessions: int
    last_play_time_date: str
    last_play_duration_time: float


@dataclass
class DayStatistics:
    date: str
    games: List[GameWithTime]
    total: int


@dataclass
class PagedDayStatistics:
    data: List[DayStatistics]
    hasPrev: bool
    hasNext: bool


@dataclass
class OverallGameTimeDto:
    id: str
    name: str
    time: float


@dataclass
class GameSessionsTime:
    date: str
    duration: float
    migrated: str | None


@dataclass
class YearlyStatistics:
    month: int
    month_name: str
    total: float
    sessions_count: int
    sessions: List[GameSessionsTime]


@dataclass
class PagedYearStatistics:
    data: List[YearlyStatistics]
    hasPrev: bool
    hasNext: bool
