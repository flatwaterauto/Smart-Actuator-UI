export interface Bin {
	id: number;
	ingredientId: number; // Changed from ingredient string
	resistance: number; // Changed from resistorValue
	openTime: number; // New field
	slowDownTime: number; // New field
	augerOffset: number; // New field
	augerOffsetCount: number; // New field
	offsetLocked: boolean; // New field
}

export class BinSettingsHandler {
	private binSettings: Bin[] = [];
	private hasBeenUpdated: boolean = false;
	// Replace array with Map for better reference handling
	private listeners: Map<() => void, boolean> = new Map();

	public getBinSettings(): Bin[] {
		return [...this.binSettings];
	}

	public setBinSettings(settings: Bin[]): void {
		console.log("Setting bin settings. Current state:", {
			wasUpdated: this.hasBeenUpdated,
			oldSettings: this.binSettings,
			newSettings: settings,
		});

		// Set the flag first
		this.hasBeenUpdated = true;
		// Then update the settings
		this.binSettings = [...settings];

		console.log("Bin settings updated:", this.binSettings);
		console.log("Notifying listeners, count:", this.listeners.size);
		console.log("Updated flag is now:", this.hasBeenUpdated); // Add this log

		this.notifyListeners();
	}

	public updateBinSetting(binSetting: Bin): void {
		const index = this.binSettings.findIndex((bin) => bin.id === binSetting.id);
		if (index !== -1) {
			this.binSettings[index] = { ...binSetting };
		} else {
			this.binSettings.push({ ...binSetting });
		}
		this.notifyListeners();
	}

	public addListener(listener: () => void): void {
		console.log("Adding new listener");
		console.log("Current listeners count:", this.listeners.size);
		console.log("Listener function:", listener.toString());

		this.listeners.set(listener, true);

		console.log("New listeners count:", this.listeners.size);
		// Immediately notify new listener of current state
		listener();
	}

	public removeListener(listener: () => void): void {
		console.log("Removing listener");
		console.log("Current listeners count:", this.listeners.size);
		console.log("Listener function:", listener.toString());

		this.listeners.delete(listener);

		console.log("New listeners count:", this.listeners.size);
	}

	private notifyListeners(): void {
		console.log(`Notifying ${this.listeners.size} listeners`);
		this.listeners.forEach((_, listener) => {
			try {
				listener();
			} catch (error) {
				console.error("Error in listener:", error);
			}
		});
	}

	public isUpdated(): boolean {
		const updated = this.hasBeenUpdated;
		console.log("Checking if updated:", updated);
		return updated; // Store in local var to prevent race conditions
	}

	public markAsNotUpdated(): void {
		console.log("Marking as not updated");
		this.hasBeenUpdated = false;
	}
}
