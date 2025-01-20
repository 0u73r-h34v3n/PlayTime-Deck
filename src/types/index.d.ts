type Nullable<T> = T | null | undefined;

declare module "*.css";

interface Unregisterable {
	/**
	 * Unregister the callback.
	 */
	unregister(): void;
}

interface YearlyStatistics {
	month: number;
	month_name: string;
	total: number;
	sessions_count: number;
	sessions: Array<Session>;
}

interface Session {
	date: string;
	duration: number;
	migrated?: string;
}

interface OverallGameTime {
	id: string;
	name: string;
	time: number;
}
