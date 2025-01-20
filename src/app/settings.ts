import { isNil } from "@src/utils/isNil";
import logger from "../utils";

export interface PlayTimeSettings {
	gameChartStyle: ChartStyle;
	reminderToTakeBreaksInterval: number;
	displayTime: {
		showSeconds: boolean;
		/**
		 * When `false` time will be shown as `2d 2h`
		 * when `true` time will be shown as `50h` (`48h` + `2h`)
		 */
		showTimeInHours: boolean;
	};
	coverScale: number;
}

export enum ChartStyle {
	PIE_AND_BARS = 0,
	BAR = 1,
}

const PLAY_TIME_SETTINGS_KEY = "decky-loader-SDH-Playtime";

export const DEFAULTS: PlayTimeSettings = {
	gameChartStyle: ChartStyle.BAR,
	reminderToTakeBreaksInterval: -1,
	displayTime: {
		showTimeInHours: true,
		showSeconds: false,
	},
	coverScale: 1,
};

export class Settings {
	constructor() {
		SteamClient.Storage.GetJSON(PLAY_TIME_SETTINGS_KEY)
			.then(async (json) => {
				const parsedJson = JSON.parse(json) as PlayTimeSettings;

				this.setDefaultDisplayTimeIfNeeded(parsedJson);
				this.setDefaultCoverScaleIfNeeded(parsedJson);
			})
			.catch((e: Error) => {
				if (e.message === "Not found") {
					logger.error("Unable to get settings, saving defaults", e);

					SteamClient.Storage.SetObject(PLAY_TIME_SETTINGS_KEY, DEFAULTS);

					return;
				}

				logger.error("Unable to get settings", e);
			});
	}

	async get(): Promise<PlayTimeSettings> {
		const settings = await SteamClient.Storage.GetJSON(PLAY_TIME_SETTINGS_KEY);

		if (isNil(settings)) {
			return DEFAULTS;
		}

		let data = JSON.parse(settings);

		data = {
			...data,
			coverScale: +data.coverScale,
			displayTime: {
				showTimeInHours: !!data.displayTime.showTimeInHours,
				showSeconds: !!data.displayTime.showSeconds,
			},
		};

		return data;
	}

	async save(data: PlayTimeSettings) {
		await SteamClient.Storage.SetObject(PLAY_TIME_SETTINGS_KEY, {
			...data,
			coverScale: `${data.coverScale}`,
			displayTime: {
				showTimeInHours: +data.displayTime.showTimeInHours,
				showSeconds: +data.displayTime.showSeconds,
			},
		});
	}

	private async setDefaultDisplayTimeIfNeeded(settings: PlayTimeSettings) {
		// NOTE(ynhhoJ): If fore some reason `settings` is `null` or `undefined` we should set it
		if (isNil(settings)) {
			SteamClient.Storage.SetObject(PLAY_TIME_SETTINGS_KEY, DEFAULTS);

			return;
		}

		const { displayTime } = settings;

		if (!isNil(displayTime)) {
			return;
		}

		await SteamClient.Storage.SetObject(PLAY_TIME_SETTINGS_KEY, {
			...settings,
			displayTime: DEFAULTS.displayTime,
		});
	}

	async setDefaultCoverScaleIfNeeded(settings: PlayTimeSettings) {
		// NOTE(ynhhoJ): If fore some reason `settings` is `null` or `undefined` we should set it
		if (isNil(settings)) {
			SteamClient.Storage.SetObject(PLAY_TIME_SETTINGS_KEY, DEFAULTS);

			return;
		}

		const { coverScale } = settings;

		if (!isNil(coverScale) || (coverScale >= 0.5 && coverScale <= 2)) {
			return;
		}

		await SteamClient.Storage.SetObject(PLAY_TIME_SETTINGS_KEY, {
			...settings,
			coverScale: DEFAULTS.coverScale,
		});
	}
}
