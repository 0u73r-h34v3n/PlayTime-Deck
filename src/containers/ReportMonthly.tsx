import { PanelSection, PanelSectionRow } from "@decky/ui";
import { registerForInputEvent } from "@src/steam/registerForInputEvent";
import { useEffect, useState } from "react";
import { formatMonthInterval } from "../app/formatters";
import {
	type DailyStatistics,
	convertDailyStatisticsToGameWithTime,
} from "../app/model";
import { type Paginated, empty } from "../app/reports";
import { ChartStyle } from "../app/settings";
import { Pager } from "../components/Pager";
import { AverageAndOverall } from "../components/statistics/AverageAndOverall";
import { GamesTimeBarView } from "../components/statistics/GamesTimeBarView";
import { MonthView } from "../components/statistics/MonthView";
import { PieView } from "../components/statistics/PieView";
import { useLocator } from "../locator";

export const ReportMonthly = () => {
	const { reports, currentSettings: settings } = useLocator();
	const [lastChangedPageTimeStamp, setLastChangedPageTimeStamp] =
		useState<number>(0);
	const [isLoading, setLoading] = useState<boolean>(false);
	const [currentPage, setCurrentPage] = useState<Paginated<DailyStatistics>>(
		empty(),
	);

	useEffect(() => {
		setLoading(true);

		reports.monthlyStatistics().then((it) => {
			setCurrentPage(it);
			setLoading(false);
		});
	}, []);

	useEffect(() => {
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

	return (
		<div>
			<PanelSection>
				<PanelSectionRow>
					<Pager
						onNext={onNextWeek}
						onPrev={onPrevWeek}
						currentText={formatMonthInterval(currentPage.current().interval)}
						hasNext={currentPage.hasNext()}
						hasPrev={currentPage.hasPrev()}
						prevKey="l2"
						nextKey="r2"
					/>
				</PanelSectionRow>
			</PanelSection>

			{isLoading && <div>Loading...</div>}

			{!isLoading && !currentPage && <div>Error while loading data</div>}

			{!isLoading && currentPage && (
				<div>
					<AverageAndOverall statistics={currentPage.current().data} />
					<MonthView statistics={currentPage.current().data} />
					<GamesTimeBarView
						data={convertDailyStatisticsToGameWithTime(
							currentPage.current().data,
						)}
					/>

					{settings.gameChartStyle === ChartStyle.PIE_AND_BARS && (
						<PieView statistics={currentPage.current().data} />
					)}
				</div>
			)}
		</div>
	);
};
