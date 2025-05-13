export class LiveDataHandler {
	private currentBinType: string = "";
	private previousBinType: string = "";
	private currentWeight: number = 0;
	private listeners: (() => void)[] = [];

	public setCurrentBinType(binType: string): void {
		if (this.currentBinType !== binType && this.currentBinType !== "None") {
			this.previousBinType = this.currentBinType;
		}
		this.currentBinType = binType;
		this.notifyListeners();
	}

	public getCurrentBinType(): string {
		return this.currentBinType;
	}

	public getLastIngredient(): string {
		return this.previousBinType;
	}

	public setCurrentWeight(weight: number): void {
		this.currentWeight = weight;
		this.notifyListeners();
	}

	public getCurrentWeight(): number {
		return this.currentWeight;
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
