import { memo } from "@src/utils/memo";
import { isNil } from "../isNil";

function getGameCoverImage(gameId: string): string | undefined {
	const gameOverview = appStore.GetAppOverviewByGameID(gameId);

	if (isNil(gameOverview)) {
		return undefined;
	}

	if (gameOverview?.app_type === 1073741824) {
		const images = appStore.GetCustomImageURLs(gameOverview);

		if (isNil(images) || images.length === 0) {
			return undefined;
		}

		return images[0]?.replace("undefined", "p")?.replace("jpg", "png") ?? "";
	}

	const image = appStore.GetVerticalCapsuleURLForApp(gameOverview) ?? "";

	return image;
}

const TWO_MINUTES = 2 * 60 * 1000;
export const getGameCoverImageMemo = memo(
	(gameId: string) => getGameCoverImage(gameId),
	{
		ttl: TWO_MINUTES,
	},
);
