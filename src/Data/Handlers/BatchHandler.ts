export interface BatchInfo {
	recipeId: number;
	quantity: number;
}

export class BatchHandler {
	private currentBatch: BatchInfo | null = null;

	public startBatch(recipeId: number, quantity: number): void {
		this.currentBatch = { recipeId, quantity };
	}

	public getCurrentBatch(): BatchInfo | null {
		return this.currentBatch;
	}

	public endBatch(): void {
		this.currentBatch = null;
	}
}
