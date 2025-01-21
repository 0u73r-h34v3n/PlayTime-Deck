import type { GameWithTime } from "./model";

export const SortBy = {
	NAME: {
		key: "name",
		name: "By Name",
	},
	FIRST_PLAYTIME: {
		key: "firstPlaytime",
		name: "By First Playtime",
	},
	MOST_PLAYED: {
		key: "mostPlayed",
		name: "By Most Played",
	},
	LEAST_PLAYED: {
		key: "leastPlayed",
		name: "By Least Played",
	},
	MOST_LAUNCHED: {
		key: "mostLaunched",
		name: "By Most Launched",
	},
	LEAST_LAUNCHED: {
		key: "leastLaunched",
		name: "By Least Launched",
	},
	MOST_AVERAGE_TIME_PLAYED: {
		key: "mostAverageTimePlayed",
		name: "By Most Average Time Played",
	},
	LEAST_AVERAGE_TIME_PLAYED: {
		key: "leastAverageTimePlayed",
		name: "By Least Average Time Played",
	},
} as const;

export type SortByObjectKeys = keyof typeof SortBy;
export type SortByKeys = Pick<
	(typeof SortBy)[keyof typeof SortBy],
	"key"
>["key"];

function sortByName(playedTime: Array<GameWithTime>) {
	return playedTime.sort((a, b) => a.game.name.localeCompare(b.game.name));
}

function sortByMostPlayed(playedTime: Array<GameWithTime>) {
	return playedTime.sort((a, b) => b.time - a.time);
}

function sortByLeastPlayed(playedTime: Array<GameWithTime>) {
	return playedTime.sort((a, b) => a.time - b.time);
}

function sortByMostLaunched(playedTime: Array<GameWithTime>) {
	return playedTime.sort((a, b) => b.total_sessions - a.total_sessions);
}

function sortByLeastLaunched(playedTime: Array<GameWithTime>) {
	return playedTime.sort((a, b) => a.total_sessions - b.total_sessions);
}

function sortByMostAverageTimePlayed(playedTime: Array<GameWithTime>) {
	return playedTime.sort((a, b) => {
		const avgTimeA = a.time / a.total_sessions;
		const avgTimeB = b.time / b.total_sessions;

		return avgTimeB - avgTimeA;
	});
}

function sortByLeastAverageTimePlayed(playedTime: Array<GameWithTime>) {
	return playedTime.sort((a, b) => {
		const avgTimeA = a.time / a.total_sessions;
		const avgTimeB = b.time / b.total_sessions;

		return avgTimeA - avgTimeB;
	});
}

export function sortPlayedTime(
	playedTimea: Array<GameWithTime>,
	sort: SortByKeys,
) {
	const playedTime = playedTimea.slice(0);

	if (SortBy.NAME.key === sort) {
		return sortByName(playedTime);
	}

	if (SortBy.MOST_PLAYED.key === sort) {
		return sortByMostPlayed(playedTime);
	}

	if (SortBy.LEAST_PLAYED.key === sort) {
		return sortByLeastPlayed(playedTime);
	}

	if (SortBy.MOST_LAUNCHED.key === sort) {
		return sortByMostLaunched(playedTime);
	}

	if (SortBy.LEAST_LAUNCHED.key === sort) {
		return sortByLeastLaunched(playedTime);
	}

	if (SortBy.MOST_AVERAGE_TIME_PLAYED.key === sort) {
		return sortByMostAverageTimePlayed(playedTime);
	}

	if (SortBy.LEAST_AVERAGE_TIME_PLAYED.key === sort) {
		return sortByLeastAverageTimePlayed(playedTime);
	}

	return sortByMostPlayed(playedTime);
}
