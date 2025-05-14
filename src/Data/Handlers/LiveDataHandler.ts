export class LiveDataHandler {
	private currentBinType: string = "";
	private previousBinType: string = "";
	private currentWeight: number = 0;
	private isDumping: boolean = false;
	private listeners: (() => void)[] = [];

	//for sound
	private dingVolume: number = 0.5; // Default volume (0.0 to 1.0)
	private static readonly DING_VOLUME_STORAGE_KEY = "ding_volume";

	constructor() {
		// Load volume from local storage if available
		const savedVolume = localStorage.getItem(
			LiveDataHandler.DING_VOLUME_STORAGE_KEY
		);
		if (savedVolume !== null) {
			const parsedVolume = parseFloat(savedVolume);
			if (!isNaN(parsedVolume) && parsedVolume >= 0 && parsedVolume <= 1) {
				this.dingVolume = parsedVolume;
			}
		}
	}

	public setDingVolume(volume: number) {
		if (volume >= 0 && volume <= 1) {
			this.dingVolume = volume;
			// Save to local storage
			localStorage.setItem(
				LiveDataHandler.DING_VOLUME_STORAGE_KEY,
				volume.toString()
			);
			this.notifyListeners(); // Notify listeners about the volume change
		}
	}

	public getDingVolume(): number {
		return this.dingVolume;
	}

	// Simple function to play a sound at half volume
	public playDing(): void {
		const audio = new Audio("/beep.mp3");
		audio.volume = this.dingVolume; // Set to half volume (50%)
		audio.play().catch((err) => console.error("Audio playback error:", err));
	}

	public setCurrentBinType(binType: string): void {
		if (this.currentBinType !== binType) {
			if (this.currentBinType !== "None") {
				this.previousBinType = this.currentBinType;
			}

			this.currentBinType = binType;
			this.notifyListeners();
		}
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

	public setDumpInProgress(isDumping: boolean): void {
		if (this.isDumping !== isDumping) {
			this.isDumping = isDumping;
			if (!isDumping) {
				this.playDing();
			}
			this.notifyListeners();
		}
	}

	public isDumpInProgress(): boolean {
		return this.isDumping;
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
