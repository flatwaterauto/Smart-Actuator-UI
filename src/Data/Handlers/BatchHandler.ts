export interface BatchInfo {
	recipeId: number;
	quantity: number;
}

export class BatchHandler {
	private currentBatch: BatchInfo | null = null;
	private listeners: (() => void)[] = [];

	public startBatch(recipeId: number, quantity: number): void {
		this.currentBatch = { recipeId, quantity };
		this.notifyListeners();
	}

	public getCurrentBatch(): BatchInfo | null {
		return this.currentBatch;
	}

	public endBatch(): void {
		this.currentBatch = null;
		this.notifyListeners();
	}

	public addListener(listener: () => void): void {
		this.listeners.push(listener);
	}

	public removeListener(listener: () => void): void {
		this.listeners = this.listeners.filter((l) => l !== listener);
	}

	private notifyListeners(): void {
		for (const listener of this.listeners) {
			listener();
		}
	}
}
