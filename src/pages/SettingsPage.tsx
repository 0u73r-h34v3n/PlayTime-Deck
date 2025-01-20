import {
	ButtonItem,
	Dropdown,
	Field,
	PanelSection,
	PanelSectionRow,
	SidebarNavigation,
} from "@decky/ui";
import { useEffect, useState } from "react";
import { ChartStyle, DEFAULTS, type PlayTimeSettings } from "../app/settings";
import { Tab } from "../components/Tab";
import { useLocator } from "../locator";
import { MANUALLY_ADJUST_TIME, navigateToPage } from "./navigation";

export const GeneralSettings = () => {
	const { settings } = useLocator();
	const [current, setCurrent] = useState<PlayTimeSettings>(DEFAULTS);
	const [loaded, setLoaded] = useState<boolean>(false);

	const loadSettings = () => {
		setLoaded(false);

		settings.get().then((r) => {
			setCurrent(r);
			setLoaded(true);
		});
	};

	useEffect(() => {
		loadSettings();
	}, []);

	const updateSettings = async () => {
		await settings.save(current);
		loadSettings();
	};

	return (
		<div>
			{loaded && (
				<div>
					<PanelSection title="Appearance">
						<PanelSectionRow>
							<Field label="Game charts type">
								<Dropdown
									selectedOption={current?.gameChartStyle}
									rgOptions={[
										{
											label: "Bar charts",
											data: ChartStyle.BAR,
										},
										{
											label: "Bar and Pie charts",
											data: ChartStyle.PIE_AND_BARS,
										},
									]}
									onChange={(v) => {
										current.gameChartStyle = v.data;
										updateSettings();
									}}
								/>
							</Field>

							<Field label="Display played time in">
								<Dropdown
									selectedOption={current?.displayTime.showTimeInHours}
									rgOptions={[
										{
											label: "Days",
											data: false,
										},
										{
											label: "Hours",
											data: true,
										},
									]}
									onChange={(v) => {
										current.displayTime.showTimeInHours = v.data;
										updateSettings();
									}}
								/>
							</Field>

							<Field label="Show seconds">
								<Dropdown
									selectedOption={current?.displayTime.showSeconds}
									rgOptions={[
										{
											label: "No",
											data: false,
										},
										{
											label: "Yes",
											data: true,
										},
									]}
									onChange={(v) => {
										current.displayTime.showSeconds = v.data;
										updateSettings();
									}}
								/>
							</Field>

							<Field label="Scale covers size">
								<Dropdown
									selectedOption={+current?.coverScale.toPrecision(1)}
									rgOptions={[
										0.5, 0.6, 0.7, 0.8, 0.9, 1, 1.1, 1.2, 1.3, 1.4, 1.5, 1.6,
										1.7, 1.8, 1.9, 2,
									].map((scale) => ({
										label: `${scale}`,
										data: scale,
									}))}
									onChange={(v) => {
										current.coverScale = v.data;
										updateSettings();
									}}
								/>
							</Field>
						</PanelSectionRow>
					</PanelSection>

					<PanelSection title="Notifications">
						<PanelSectionRow>
							<Field label="Remind me to take breaks">
								<Dropdown
									selectedOption={current.reminderToTakeBreaksInterval}
									rgOptions={[
										{ label: "Never", data: -1 },
										{ label: "Every 15 min", data: 15 },
										{ label: "Every 30 min", data: 30 },
										{ label: "Every hour", data: 60 },
										{ label: "Every 2 hours", data: 120 },
									]}
									onChange={(v) => {
										current.reminderToTakeBreaksInterval = v.data;
										updateSettings();
									}}
								/>
							</Field>
						</PanelSectionRow>
					</PanelSection>
				</div>
			)}
		</div>
	);
};

export const TimeManipulation = () => {
	return (
		<div>
			<PanelSection title="Change overall play time">
				<PanelSectionRow>
					<ButtonItem onClick={() => navigateToPage(MANUALLY_ADJUST_TIME)}>
						Change
					</ButtonItem>
				</PanelSectionRow>
			</PanelSection>
		</div>
	);
};

export const SettingsPage = () => {
	return (
		<SidebarNavigation
			pages={[
				{
					title: "General",
					content: (
						<Tab>
							<GeneralSettings />
						</Tab>
					),
				},
				{
					title: "Time manipulation",
					content: (
						<Tab>
							<TimeManipulation />
						</Tab>
					),
				},
			]}
		/>
	);
};
