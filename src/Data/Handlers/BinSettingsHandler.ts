export interface Bin {
	id: number;
	ingredientId: number; // Changed from ingredient string
	resistance: number; // Changed from resistorValue
	openTime: number; // New field
	slowDownTime: number; // New field
	augerOffset: number; // New field
	augerOffsetCount: number; // New field
	offsetLocked: boolean; // New field
	motorReversed: boolean; // Adding the motor reversed field
}

export class BinSettingsHandler {
	private static instanceCounter = 0;
	private instanceId: number;
	private binSettings: Bin[] = [];
	private hasBeenUpdated: boolean = false;
	private listenerIdCounter = 0;
	private listeners: Map<() => void, number> = new Map();

	constructor() {
		this.instanceId = ++BinSettingsHandler.instanceCounter;
		console.log(
			`[BinSettings] Created BinSettingsHandler instance #${this.instanceId}`
		);
	}

	// For logging purposes
	toString() {
		return `BinSettingsHandler#${this.instanceId}`;
	}

	public getBinSettings(): Bin[] {
		return [...this.binSettings];
	}

	public setBinSettings(settings: Bin[]): void {
		console.log(
			`[BinSettings] [Instance #${this.instanceId}] Setting bin settings. Current state:`,
			{
				wasUpdated: this.hasBeenUpdated,
				oldSettings: this.binSettings,
				newSettings: settings,
			}
		);

		// Set the flag first
		this.hasBeenUpdated = true;
		// Then update the settings
		this.binSettings = [...settings];

		console.log(
			`[BinSettings] [Instance #${this.instanceId}] Bin settings updated:`,
			this.binSettings
		);
		console.log(
			`[BinSettings] [Instance #${this.instanceId}] Notifying listeners, count:`,
			this.listeners.size
		);
		console.log(
			`[BinSettings] [Instance #${this.instanceId}] Updated flag is now:`,
			this.hasBeenUpdated
		);

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
		const listenerId = ++this.listenerIdCounter;
		console.log(`[BinSettings] Adding listener #${listenerId}`);
		console.log(
			`[BinSettings] Current listeners count: ${this.listeners.size}`
		);

		this.listeners.set(listener, listenerId);
		console.log(`[BinSettings] New listeners count: ${this.listeners.size}`);
		console.log(
			`[BinSettings] Active listener IDs:`,
			Array.from(this.listeners.values())
		);

		// Immediately notify new listener of current state
		try {
			listener();
			console.log(
				`[BinSettings] Successfully called initial update for listener #${listenerId}`
			);
		} catch (error) {
			console.error(
				`[BinSettings] Error in initial listener call #${listenerId}:`,
				error
			);
		}
	}

	public removeListener(listener: () => void): void {
		const listenerId = this.listeners.get(listener);
		console.log(`[BinSettings] Removing listener #${listenerId}`);
		console.log(
			`[BinSettings] Current listeners count: ${this.listeners.size}`
		);

		this.listeners.delete(listener);
		console.log(`[BinSettings] New listeners count: ${this.listeners.size}`);
		console.log(
			`[BinSettings] Remaining listener IDs:`,
			Array.from(this.listeners.values())
		);
	}

	private notifyListeners(): void {
		console.log(`[BinSettings] Notifying ${this.listeners.size} listeners`);
		this.listeners.forEach((id, listener) => {
			try {
				console.log(`[BinSettings] Calling listener #${id}`);
				listener();
				console.log(`[BinSettings] Successfully called listener #${id}`);
			} catch (error) {
				console.error(`[BinSettings] Error in listener #${id}:`, error);
			}
		});
	}

	public isUpdated(): boolean {
		console.log(
			`[BinSettings] [Instance #${this.instanceId}] Checking if updated:`,
			this.hasBeenUpdated
		);
		return this.hasBeenUpdated;
	}

	public markAsNotUpdated(): void {
		console.log(
			`[BinSettings] [Instance #${this.instanceId}] Marking as not updated`
		);
		this.hasBeenUpdated = false;
	}
}
