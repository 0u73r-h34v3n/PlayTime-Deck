import { Menu, MenuItem, PanelSection, showContextMenu } from "@decky/ui";
import {
	SortBy,
	type SortByKeys,
	type SortByObjectKeys,
	sortPlayedTime,
} from "@src/app/sortPlayTime";
import { registerForInputEvent } from "@src/steam/registerForInputEvent";
import { useEffect, useMemo, useState } from "react";
import { formatWeekInterval } from "../app/formatters";
import {
	type DailyStatistics,
	convertDailyStatisticsToGameWithTime,
} from "../app/model";
import { type Paginated, empty } from "../app/reports";
import { ChartStyle } from "../app/settings";
import { Pager } from "../components/Pager";
import { AverageAndOverall } from "../components/statistics/AverageAndOverall";
import { GamesTimeBarView } from "../components/statistics/GamesTimeBarView";
import { PieView } from "../components/statistics/PieView";
import { WeekView } from "../components/statistics/WeekView";
import { useLocator } from "../locator";

interface ReportWeeklyProperties {
	slim?: boolean;
}

export const ReportWeekly = ({ slim = false }: ReportWeeklyProperties) => {
	const { reports, currentSettings: settings } = useLocator();
	const [lastChangedPageTimeStamp, setLastChangedPageTimeStamp] =
		useState<number>(0);
	const [isLoading, setLoading] = useState<boolean>(false);
	const [currentPage, setCurrentPage] = useState<Paginated<DailyStatistics>>(
		empty(),
	);

	const [sortType, setSortType] = useState<SortByKeys>("mostPlayed");

	const sortedData = useMemo(
		() =>
			sortPlayedTime(
				convertDailyStatisticsToGameWithTime(currentPage.current().data),
				sortType,
			),
		[
			sortType,
			convertDailyStatisticsToGameWithTime(currentPage.current().data),
		],
	);

	useEffect(() => {
		setLoading(true);

		reports.weeklyStatistics().then((it) => {
			setCurrentPage(it);
			setLoading(false);
		});
	}, []);

	useEffect(() => {
		if (slim) {
			return;
		}

		const { unregister } = registerForInputEvent((_buttons, rawEvent) => {
			if (rawEvent.length === 0) {
				return;
			}

			const DELAY = 500;

			if (new Date().getTime() - lastChangedPageTimeStamp <= DELAY) {
				return;
			}

			// NOTE(ynhhoJ): Aproximative value
			const TRIGGER_PUSH_FORCE_UNTIL_VIBRATION = 12000;
			const isLeftTriggerPressed =
				rawEvent[0].sTriggerL >= TRIGGER_PUSH_FORCE_UNTIL_VIBRATION;

			if (isLeftTriggerPressed && currentPage.hasPrev()) {
				setLastChangedPageTimeStamp(new Date().getTime());

				onPrevWeek();
			}

			const isRightTriggerPressed =
				rawEvent[0].sTriggerR >= TRIGGER_PUSH_FORCE_UNTIL_VIBRATION;

			if (isRightTriggerPressed && currentPage.hasNext()) {
				setLastChangedPageTimeStamp(new Date().getTime());

				onNextWeek();
			}
		});

		return () => {
			unregister();
		};
	}, [
		currentPage.current().interval.start.getTime(),
		currentPage.current().interval.end.getTime(),
	]);

	const onNextWeek = () => {
		setLoading(true);

		currentPage?.next().then((it) => {
			setCurrentPage(it);
			setLoading(false);
		});
	};

	const onPrevWeek = () => {
		setLoading(true);

		currentPage?.prev().then((it) => {
			setCurrentPage(it);
			setLoading(false);
		});
	};

	const data = currentPage.current().data;
	const isAnyGames =
		data
			.map((it) => {
				return it.games.length;
			})
			.reduce((a, b) => a + b, 0) > 0;

	const onOptionsPress = () => {
		const objectKeys = Object.keys(
			SortBy,
		) as unknown as Array<SortByObjectKeys>;

		showContextMenu(
			<Menu label="Sort titles">
				{objectKeys.map((key) => {
					return (
						<MenuItem
							key={SortBy[key].key}
							onSelected={() => {
								setSortType(() => SortBy[key].key);
							}}
						>
							{SortBy[key].name}
						</MenuItem>
					);
				})}
			</Menu>,
		);
	};

	return (
		<div>
			<Pager
				onNext={onNextWeek}
				onPrev={onPrevWeek}
				currentText={formatWeekInterval(currentPage.current().interval)}
				hasNext={currentPage.hasNext()}
				hasPrev={currentPage.hasPrev()}
				prevKey={slim ? undefined : "l2"}
				nextKey={slim ? undefined : "r2"}
			/>

			{isLoading && <div>Loading...</div>}

			{!isLoading && !currentPage && <div>Error while loading data</div>}

			{!isLoading && currentPage && (
				<div>
					<AverageAndOverall statistics={data} />

					<PanelSection title="By day">
						<WeekView statistics={data} />
					</PanelSection>

					{isAnyGames && (
						<PanelSection title="By game">
							<GamesTimeBarView
								data={sortedData}
								showCovers={!slim}
								onOptionsPress={onOptionsPress}
							/>

							{settings.gameChartStyle === ChartStyle.PIE_AND_BARS && (
								<PieView statistics={data} />
							)}
						</PanelSection>
					)}
				</div>
			)}
		</div>
	);
};
