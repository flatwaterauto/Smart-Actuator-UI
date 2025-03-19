export class LiveDataHandler {
	private currentBinType: string = "";
	private previousBinType: string = "";
	private currentWeight: number = 0;

	public setCurrentBinType(binType: string): void {
		this.previousBinType = this.currentBinType;
		this.currentBinType = binType;
	}

	public getCurrentBinType(): string {
		return this.currentBinType;
	}

	public getLastIngredient(): string {
		return this.previousBinType;
	}

	public setCurrentWeight(weight: number): void {
		this.currentWeight = weight;
	}

	public getCurrentWeight(): number {
		return this.currentWeight;
	}
}
