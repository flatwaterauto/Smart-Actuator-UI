export interface Bin {
	id: number;
	ingredient: string;
	resistorValue: number;
}

export class BinSettingsHandler {
	private binSettings: Bin[] = [];
	private hasBeenUpdated: boolean = false;

	public getBinSettings(): Bin[] {
		return [...this.binSettings];
	}

	public setBinSettings(settings: Bin[]): void {
		this.binSettings = [...settings];
		this.hasBeenUpdated = true;
	}

	public updateBinSetting(binSetting: Bin): void {
		const index = this.binSettings.findIndex((bin) => bin.id === binSetting.id);
		if (index !== -1) {
			this.binSettings[index] = { ...binSetting };
		} else {
			this.binSettings.push({ ...binSetting });
		}
	}

	public isUpdated(): boolean {
		return this.hasBeenUpdated;
	}

	public markAsNotUpdated(): void {
		this.hasBeenUpdated = false;
	}
}
