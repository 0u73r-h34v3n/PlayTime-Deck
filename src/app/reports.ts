import {
	endOfMonth,
	endOfWeek,
	endOfYear,
	startOfMonth,
	startOfWeek,
	startOfYear,
} from "../utils";
import type { Backend } from "./backend";
import type { DailyStatistics, GameWithTime } from "./model";

export interface Interval {
	start: Date;
	end: Date;
}

interface IntervalPager {
	next(): IntervalPager;
	prev(): IntervalPager;
	current(): Interval;
}

interface Page<T> {
	data: T[];
	interval: Interval;
}

export interface Paginated<T> {
	next(): Promise<Paginated<T>>;
	hasNext(): boolean;

	prev(): Promise<Paginated<T>>;
	hasPrev(): boolean;

	current(): Page<T>;
}

export function empty<T>() {
	return {
		next: async () => empty<T>(),
		hasNext: () => false,
		prev: async () => empty<T>(),
		hasPrev: () => false,
		current: () => ({
			data: [],
			interval: { start: new Date(), end: new Date() },
		}),
	};
}

export enum IntervalType {
	Weekly = 0,
	Monthly = 1,
	Yearly = 2,
}

export class Reports {
	private backend: Backend;

	constructor(backend: Backend) {
		this.backend = backend;
	}

	public async weeklyStatistics(): Promise<Paginated<DailyStatistics>> {
		return PerDayPaginatedImpl.create(
			this.backend,
			IntervalPagerImpl.create(IntervalType.Weekly, new Date()),
		);
	}

	public async monthlyStatistics(): Promise<Paginated<DailyStatistics>> {
		return PerDayPaginatedImpl.create(
			this.backend,
			IntervalPagerImpl.create(IntervalType.Monthly, new Date()),
		);
	}

	public async yearlyStatistics(
		gameId: string,
	): Promise<Paginated<YearlyStatistics>> {
		return PerYearPaginatedImpl.create(
			this.backend,
			IntervalPagerImpl.create(IntervalType.Yearly, new Date()),
			gameId,
		);
	}

	public async overallStatistics(): Promise<GameWithTime[]> {
		return await this.backend.fetchPerGameOverallStatistics();
	}
}

class PerDayPaginatedImpl implements Paginated<DailyStatistics> {
	private backend: Backend;
	private intervalPager: IntervalPager;
	private data: DailyStatistics[];
	private hasPrevPage: boolean;

	private constructor(
		backend: Backend,
		intervalPager: IntervalPager,
		data: DailyStatistics[],
		hasPrevPage: boolean,
	) {
		this.backend = backend;
		this.intervalPager = intervalPager;
		this.data = data;
		this.hasPrevPage = hasPrevPage;
	}

	hasNext(): boolean {
		const nextInterval = this.intervalPager.next().current();
		const today = new Date();
		return nextInterval.start <= today;
	}

	hasPrev(): boolean {
		return this.hasPrevPage;
	}

	static async create(
		backend: Backend,
		intervalPager: IntervalPager,
	): Promise<Paginated<DailyStatistics>> {
		const data = await backend.fetchDailyStatisticForInterval(
			intervalPager.current().start,
			intervalPager.current().end,
		);
		return new PerDayPaginatedImpl(
			backend,
			intervalPager,
			data.data,
			data.hasPrev,
		);
	}

	next(): Promise<Paginated<DailyStatistics>> {
		const nextIntervalPager = this.intervalPager.next();
		return PerDayPaginatedImpl.create(this.backend, nextIntervalPager);
	}
	prev(): Promise<Paginated<DailyStatistics>> {
		const prevIntervalPager = this.intervalPager.prev();
		return PerDayPaginatedImpl.create(this.backend, prevIntervalPager);
	}

	current(): Page<DailyStatistics> {
		return {
			data: this.data,
			interval: this.intervalPager.current(),
		};
	}
}

class PerYearPaginatedImpl implements Paginated<YearlyStatistics> {
	private backend: Backend;
	private intervalPager: IntervalPager;
	private data: Array<YearlyStatistics>;
	private hasPrevPage: boolean;
	private hasNextPage: boolean;
	private gameId: number;

	private constructor(
		backend: Backend,
		intervalPager: IntervalPager,
		gameId: number,
		data: Array<YearlyStatistics>,
		hasPrevPage: boolean,
		hasNextPage: boolean,
	) {
		this.backend = backend;
		this.intervalPager = intervalPager;
		this.data = data;
		this.hasPrevPage = hasPrevPage;
		this.hasNextPage = hasNextPage;
		this.gameId = gameId;
	}

	hasNext(): boolean {
		return this.hasNextPage;
	}

	hasPrev(): boolean {
		return this.hasPrevPage;
	}

	static async create(
		backend: Backend,
		intervalPager: IntervalPager,
		gameId: string,
	): Promise<Paginated<YearlyStatistics>> {
		const data = await backend.fetchGameStatistcsPerYear(
			gameId,
			intervalPager.current().start.getFullYear(),
		);

		return new PerYearPaginatedImpl(
			backend,
			intervalPager,
			gameId,
			data.data,
			data.hasPrev,
			data.hasNext,
		);
	}

	next(): Promise<Paginated<YearlyStatistics>> {
		const nextIntervalPager = this.intervalPager.next();

		return PerYearPaginatedImpl.create(
			this.backend,
			nextIntervalPager,
			this.gameId,
		);
	}

	prev(): Promise<Paginated<YearlyStatistics>> {
		const prevIntervalPager = this.intervalPager.prev();

		return PerYearPaginatedImpl.create(
			this.backend,
			prevIntervalPager,
			this.gameId,
		);
	}

	current(): Page<YearlyStatistics> {
		return {
			data: this.data,
			interval: this.intervalPager.current(),
		};
	}
}

export class IntervalPagerImpl {
	private type: IntervalType;
	private interval: Interval;

	constructor(type: IntervalType, interval: Interval) {
		this.type = type;
		this.interval = interval;
	}

	static create(type: IntervalType, date: Date): IntervalPager {
		if (type === IntervalType.Weekly) {
			const start = startOfWeek(date);
			const end = endOfWeek(start);

			return new IntervalPagerImpl(type, { start, end });
		}

		if (type === IntervalType.Yearly) {
			const start = startOfYear(date);
			const end = endOfYear(start);

			return new IntervalPagerImpl(type, { start, end });
		}

		const start = startOfMonth(date);
		const end = endOfMonth(start);

		return new IntervalPagerImpl(type, { start, end });
	}

	public next(): IntervalPager {
		const nextDate = new Date(this.interval.end);
		nextDate.setDate(this.interval.end.getDate() + 1);

		if (this.type === IntervalType.Weekly) {
			const start = startOfWeek(nextDate);
			const end = endOfWeek(start);

			return new IntervalPagerImpl(this.type, { start, end });
		}

		if (this.type === IntervalType.Yearly) {
			const nextYear = new Date(
				new Date(this.interval.start).setFullYear(
					this.interval.start.getFullYear() + 1,
				),
			);

			return new IntervalPagerImpl(this.type, {
				start: nextYear,
				end: new Date(),
			});
		}

		const start = startOfMonth(nextDate);
		const end = endOfMonth(start);

		return new IntervalPagerImpl(this.type, { start, end });
	}

	public prev(): IntervalPager {
		const prevDate = new Date(this.interval.start);
		prevDate.setDate(this.interval.start.getDate() - 1);

		if (this.type === IntervalType.Weekly) {
			const start = startOfWeek(prevDate);
			const end = endOfWeek(start);

			return new IntervalPagerImpl(this.type, { start, end });
		}

		if (this.type === IntervalType.Yearly) {
			const previousYear = new Date(
				new Date(this.interval.start).setFullYear(
					this.interval.start.getFullYear() - 1,
				),
			);

			return new IntervalPagerImpl(this.type, {
				start: previousYear,
				end: new Date(),
			});
		}

		const start = startOfMonth(prevDate);
		const end = endOfMonth(start);

		return new IntervalPagerImpl(this.type, { start, end });
	}

	public current(): Interval {
		return this.interval;
	}
}
