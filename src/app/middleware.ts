import { Router } from "@decky/ui";
import { diffArray } from "@src/utils/diff";
import { reaction } from "mobx";
import { isNil } from "../utils/isNil";
import type { AppOverview, Game } from "./model";
import type { Clock, EventBus, Mountable } from "./system";

export { SteamEventMiddleware, type SteamHook };

class SteamEventMiddleware implements Mountable {
	private clock: Clock;
	private eventBus: EventBus;

	constructor(eventBus: EventBus, clock: Clock) {
		this.eventBus = eventBus;
		this.clock = clock;
	}

	private activeHooks: Array<SteamHook> = [];

	public mount() {
		const gameInfo = this.fetchGameInfo();

		if (!isNil(gameInfo)) {
			this.eventBus.emit({
				type: "GameWasRunningBefore",
				createdAt: this.clock.getTimeMs(),
				game: gameInfo,
			});
		}

		// hook login state (user login/logout)
		this.activeHooks.push(
			SteamClient.User.RegisterForLoginStateChange((username: string) => {
				if (username) {
					this.eventBus.emit({
						type: "UserLoggedIn",
						createdAt: this.clock.getTimeMs(),
						username: username,
					});
				} else {
					this.eventBus.emit({
						type: "UserLoggedOut",
						createdAt: this.clock.getTimeMs(),
					});
				}
			}),
		);

		this.activeHooks.push({
			unregister: reaction(
				() => SteamUIStore.RunningApps,
				(
					currentRunningApps: Array<AppOverview>,
					oldRunnedApps: Array<AppOverview>,
				) => {
					const runnedApps = diffArray(
						currentRunningApps,
						oldRunnedApps,
						"appid",
					);

					const closedApps = diffArray(
						oldRunnedApps,
						currentRunningApps,
						"appid",
					);

					for (const runnedApp of runnedApps) {
						const { appid, display_name } = runnedApp;

						if (isNil(appid) || isNil(display_name)) {
							continue;
						}

						this.eventBus.emit({
							type: "GameStarted",
							createdAt: this.clock.getTimeMs(),
							game: {
								id: `${appid}`,
								name: display_name,
							},
						});
					}

					for (const closedApp of closedApps) {
						const { appid, display_name } = closedApp;

						if (isNil(appid) || isNil(display_name)) {
							continue;
						}

						this.eventBus.emit({
							type: "GameStopped",
							createdAt: this.clock.getTimeMs(),
							game: {
								id: `${appid}`,
								name: display_name,
							},
						});
					}
				},
			),
		});

		this.activeHooks.push(
			SteamClient.System.RegisterForOnSuspendRequest(() => {
				this.eventBus.emit({
					type: "Suspended",
					createdAt: this.clock.getTimeMs(),
					game: this.fetchGameInfo(),
				});
			}),
		);

		this.activeHooks.push(
			SteamClient.System.RegisterForOnResumeFromSuspend(() => {
				this.eventBus.emit({
					type: "ResumeFromSuspend",
					createdAt: this.clock.getTimeMs(),
					game: this.fetchGameInfo(),
				});
			}),
		);
	}

	private fetchGameInfo(): Game | null {
		if (Router.MainRunningApp != null) {
			return {
				id: Router.MainRunningApp.appid,
				name: Router.MainRunningApp.display_name,
			} as Game;
		}

		return null;
	}

	public async unMount() {
		for (const it of this.activeHooks) {
			it.unregister();
		}
	}
}

interface SteamHook {
	unregister: () => void;
}
