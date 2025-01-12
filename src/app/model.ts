export {
	convertDailyStatisticsToGameWithTime,
	type AppAchievement,
	type AppAchievements,
	type AppDetails,
	type AppInfoStore,
	type AppLanguages,
	type AppStore,
	type DailyStatistics,
	type Game,
	type GameWithTime,
	type OverviewChange,
};
import type { set as MobXSet } from "mobx";

interface Game {
	id: string;
	name: string;
}

interface GameWithTime {
	game: Game;
	time: number;
}

interface DailyStatistics {
	date: string;
	games: GameWithTime[];
	total: number;
}

function convertDailyStatisticsToGameWithTime(
	data: DailyStatistics[],
): GameWithTime[] {
	const result: GameWithTime[] = [];

	for (const day of data) {
		for (const game of day.games) {
			const found = result.find((g) => g.game.id === game.game.id);

			if (found) {
				found.time += game.time;

				continue;
			}

			result.push(game);
		}
	}

	return result;
}

interface AppAchievement {
	strID: string;
	strName: string;
	strDescription: string;
	bAchieved: boolean;
	rtUnlocked: number;
	strImage: string;
	bHidden: boolean;
	flMinProgress: number;
	flCurrentProgress: number;
	flMaxProgress: number;
	flAchieved: number;
}

interface AppAchievements {
	nAchieved: number;
	nTotal: number;
	vecAchievedHidden: AppAchievement[];
	vecHighlight: AppAchievement[];
	vecUnachieved: AppAchievement[];
}

interface AppLanguages {
	strDisplayName: string;
	strShortName: string;
}

interface AppDetails {
	achievements: AppAchievements;
	bCanMoveInstallFolder: boolean;
	bCloudAvailable: boolean;
	bCloudEnabledForAccount: boolean;
	bCloudEnabledForApp: boolean;
	bCloudSyncOnSuspendAvailable: boolean;
	bCloudSyncOnSuspendEnabled: boolean;
	bCommunityMarketPresence: boolean;
	bEnableAllowDesktopConfiguration: boolean;
	bFreeRemovableLicense: boolean;
	bHasAllLegacyCDKeys: boolean;
	bHasunknownLocalContent: boolean;
	bHasLockedPrivateBetas: boolean;
	bIsExcludedFromSharing: boolean;
	bIsSubscribedTo: boolean;
	bOverlayEnabled: boolean;
	bOverrideInternalResolution: boolean;
	bRequiresLegacyCDKey: boolean;
	bShortcutIsVR: boolean;
	bShowCDKeyInMenus: boolean;
	bShowControllerConfig: boolean;
	bSupportsCDKeyCopyToClipboard: boolean;
	bVRGameTheatreEnabled: boolean;
	bWorkshopVisible: boolean;
	eAppOwnershipFlags: number;
	eAutoUpdateValue: number;
	eBackgroundDownloads: number;
	eCloudSync: number;
	eControllerRumblePreference: number;
	eDisplayStatus: number;
	eEnableThirdPartyControllerConfiguration: number;
	eSteamInputControllerMask: number;
	iInstallFolder: number;
	lDiskUsageBytes: number;
	lDlcUsageBytes: number;
	nBuildID: number;
	nCompatToolPriority: number;
	nPlaytimeForever: number;
	nScreenshots: number;
	rtLastTimePlayed: number;
	rtLastUpdated: number;
	rtPurchased: number;
	selectedLanguage: {
		strDisplayName: string;
		strShortName: string;
	};
	strCloudBytesAvailable: string;
	strCloudBytesUsed: string;
	strCompatToolDisplayName: string;
	strCompatToolName: string;
	strDeveloperName: string;
	strDeveloperURL: string;
	strDisplayName: string;
	strExternalSubscriptionURL: string;
	strFlatpakAppID: string;
	strHomepageURL: string;
	strLaunchOptions: string;
	strManualURL: string;
	strOwnerSteamID: string;
	strResolutionOverride: string;
	strSelectedBeta: string;
	strShortcutExe: string;
	strShortcutLaunchOptions: string;
	strShortcutStartDir: string;
	strSteamDeckBlogURL: string;
	unAppID: number;
	vecBetas: unknown[];
	vecDLC: unknown[];
	vecDeckCompatTestResults: unknown[];
	vecLanguages: AppLanguages[];
	vecLegacyCDKeys: unknown[];
	vecMusicAlbums: unknown[];
	vecPlatforms: string[];
	vecScreenShots: unknown[];
}

interface AppStore {
	UpdateAppOverview: unknown;
	GetAppOverviewByAppID: (id: number) => AppOverview;
	GetAppOverviewByGameID: (id: string) => AppOverview;
	CompareSortAs: unknown;
	allApps: AppOverview[];
	storeTagCounts: unknown;
	GetTopStoreTags: unknown;
	OnLocalizationChanged: unknown;
	GetStoreTagLocalization: unknown;
	GetLocalizationForStoreTag: unknown;
	AsyncGetLocalizationForStoreTag: unknown;
	sharedLibraryAccountIds: unknown;
	siteLicenseApps: unknown;
	GetIconURLForApp: unknown;
	GetLandscapeImageURLForApp: unknown;
	GetCachedLandscapeImageURLForApp: unknown;
	GetVerticalCapsuleURLForApp: (
		gameOverview: AppOverview,
	) => string | undefined;
	GetPregeneratedVerticalCapsuleForApp: unknown;
	GetCachedVerticalCapsuleURL: unknown;
	GetCustomImageURLs: (appOverview: AppOverview) => Array<string>;
	GetCustomVerticalCapsuleURLs: unknown;
	GetCustomLandcapeImageURLs: unknown;
	GetCustomHeroImageURLs: unknown;
	GetCustomLogoImageURLs: unknown;
	GetStorePageURLForApp: unknown;
	m_mapApps: {
		// set: (appId: number, appOverview: AppOverview) => void;
		set: typeof MobXSet;
		// NOTE(ynhhoJ): Custom added type
		originalSet: Nullable<typeof MobXSet>;
	};
}

interface OverviewChange {
	appid: () => number;
}

interface AppInfoStore {
	OnAppOverviewChange: (apps: Array<OverviewChange>) => void;
	// NOTE(ynhhoJ): Custom added type
	OriginalOnAppOverviewChange: Nullable<(apps: Array<OverviewChange>) => void>;
}
