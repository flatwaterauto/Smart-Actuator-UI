import { DataManager } from "../Data/DataManager";

const SERVICE_UUID = "ab79f64d-b7b4-46a3-bc61-4dc5dfa7a20d"; // Changed
const ESP_TO_PHONE_UUID = "992f7be5-1c9f-4129-a654-52dbfcb3b881"; // Changed
const PHONE_TO_ESP_UUID = "64918747-5758-428a-aaf9-0fb3e20b661b"; // Changed
const CONSOLE_UUID = "e77ebfd2-45a1-4660-9bf1-881eff0f222a"; // This one was correct

export enum CommandId {
	IsConnected = "c",
	StartBatch = "b",
	StopBatch = "s",
	StartUnload = "u",
	GetBinSettings = "g",
	EditBinSettings = "e",
	WifiUpdate = "w",
}

export class BleManager {
	private dataManager: DataManager;
	private device: BluetoothDevice | null = null;
	private server: BluetoothRemoteGATTServer | null = null;
	private isConnected: boolean = false;
	private phoneToEspChar: BluetoothRemoteGATTCharacteristic | null = null;
	private espToPhoneChar: BluetoothRemoteGATTCharacteristic | null = null;
	private consoleChar: BluetoothRemoteGATTCharacteristic | null = null;

	private MAX_RETRIES = 1;
	private RETRY_DELAY = 1000; // 1 second delay between retries

	constructor(dataManager: DataManager) {
		this.dataManager = dataManager;
		// Setup console response callback
		this.dataManager.console().setResponseCallback((text: string) => {
			const encoder = new TextEncoder();
			const data = encoder.encode(text);
			this.sendConsoleCommand(data);
		});
	}

	async startScanning(): Promise<void> {
		try {
			this.device = await navigator.bluetooth.requestDevice({
				acceptAllDevices: true,
				optionalServices: [SERVICE_UUID],
			});

			if (!this.device) {
				throw new Error("No device selected");
			}

			// Log device info for debugging
			console.log("Selected device:", {
				name: this.device.name,
				id: this.device.id,
			});

			this.device.addEventListener(
				"gattserverdisconnected",
				this.onDisconnected.bind(this)
			);
		} catch (error) {
			console.error("Error scanning for devices:", error);
			if (error instanceof DOMException && error.name === "NotFoundError") {
				throw new Error(
					"No compatible devices found. Make sure the ESP32 is powered on and in range."
				);
			}
			throw new Error(
				`Scanning failed: ${
					error instanceof Error ? error.message : String(error)
				}. Make sure Bluetooth is enabled and the device is in range.`
			);
		}
	}

	async connect(): Promise<void> {
		if (!this.device) {
			throw new Error("No device selected. Please scan for devices first.");
		}

		// Log connection attempt
		console.log("Attempting to connect to device:", this.device.name);

		// Check if device is already connected
		if (this.server?.connected) {
			console.log("Device already connected");
			return;
		}

		let retries = 0;
		while (retries < this.MAX_RETRIES) {
			try {
				// Ensure any existing connection is closed
				if (this.server) {
					this.server.disconnect();
					this.server = null;
				}

				// Wait a bit before trying to connect if this is a retry
				if (retries > 0) {
					await new Promise((resolve) => setTimeout(resolve, this.RETRY_DELAY));
				}

				console.log(`Connection attempt ${retries + 1}/${this.MAX_RETRIES}`);

				// Attempt connection with timeout
				this.server = (await Promise.race([
					this.device.gatt!.connect(),
					new Promise<never>((_, reject) =>
						setTimeout(() => reject(new Error("Connection timeout")), 5000)
					),
				])) as BluetoothRemoteGATTServer;

				// Set security level if supported
				if (this.device.gatt) {
					// Some browsers support setting security level
					if ("setPreferredPhy" in this.device.gatt) {
						console.log("Setting security level...");
						try {
							// @ts-ignore - Not in all Web Bluetooth implementations
							await this.device.gatt.setSecurityLevel("authenticated");
						} catch (e) {
							console.warn("Security level setting not supported:", e);
						}
					}
				}

				console.log("GATT server connected, getting service...");
				const service = await this.server.getPrimaryService(SERVICE_UUID);

				console.log("Service found, getting characteristics...");
				// Get characteristics one at a time with error handling
				try {
					this.phoneToEspChar = await service.getCharacteristic(
						PHONE_TO_ESP_UUID
					);
					console.log("Phone to ESP characteristic found");
				} catch (e) {
					throw new Error(`Failed to get Phone to ESP characteristic: ${e}`);
				}

				try {
					this.espToPhoneChar = await service.getCharacteristic(
						ESP_TO_PHONE_UUID
					);
					console.log("ESP to Phone characteristic found");
				} catch (e) {
					throw new Error(`Failed to get ESP to Phone characteristic: ${e}`);
				}

				try {
					this.consoleChar = await service.getCharacteristic(CONSOLE_UUID);
					console.log("Console characteristic found");
				} catch (e) {
					throw new Error(`Failed to get Console characteristic: ${e}`);
				}

				try {
					// Start notifications sequentially
					console.log("Starting ESP to Phone notifications...");
					const espToPhoneProperties = this.espToPhoneChar?.properties;
					if (espToPhoneProperties?.notify) {
						await this.espToPhoneChar.startNotifications();
						console.log("ESP to Phone notifications started successfully");
					} else {
						console.log(
							"ESP to Phone characteristic doesn't support notifications"
						);
					}

					console.log("Starting Phone to ESP notifications...");
					const phoneToEspProperties = this.phoneToEspChar?.properties;
					if (phoneToEspProperties?.notify) {
						await this.phoneToEspChar.startNotifications();
						console.log("Phone to ESP notifications started successfully");
					} else {
						console.log(
							"Phone to ESP characteristic doesn't support notifications"
						);
						console.log(phoneToEspProperties);
						console.log(JSON.stringify(phoneToEspProperties));
						console.log(this.phoneToEspChar);
					}

					console.log("Starting Console notifications...");
					const consoleProperties = this.consoleChar?.properties;
					if (consoleProperties?.notify) {
						await this.consoleChar.startNotifications();
						console.log("Console notifications started successfully");
					} else {
						console.log("Console characteristic doesn't support notifications");
					}

					console.log("All notifications configured successfully");
				} catch (e) {
					throw new Error(`Failed to start notifications: ${e}`);
				}

				// Add event listeners
				this.espToPhoneChar.addEventListener(
					"characteristicvaluechanged",
					this.handleEspNotification.bind(this)
				);

				this.phoneToEspChar.addEventListener(
					"characteristicvaluechanged",
					this.handlePhoneToEspNotification.bind(this)
				);

				this.consoleChar.addEventListener(
					"characteristicvaluechanged",
					this.handleConsoleNotification.bind(this)
				);

				this.isConnected = true;
				console.log("Connected to device:", this.device.name);
				return;
			} catch (error) {
				retries++;
				console.warn(`Connection attempt ${retries} failed:`, error);

				// If this was the last retry, throw the error
				if (retries === this.MAX_RETRIES) {
					this.isConnected = false;
					this.server = null;
					throw new Error(
						`Failed to connect after ${this.MAX_RETRIES} attempts: ${error}`
					);
				}
			}
		}
	}

	async disconnect(): Promise<void> {
		if (this.server) {
			this.server.disconnect();
			this.isConnected = false;
		}
	}

	private onDisconnected(): void {
		this.isConnected = false;
		this.server = null;
		console.log("Device disconnected");
	}

	getConnectionStatus(): boolean {
		return this.isConnected;
	}

	private handleEspNotification(event: Event): void {
		const value = (event.target as BluetoothRemoteGATTCharacteristic).value;
		if (!value) return;

		// Track if a dump in progress block was found
		let dumpBlockFound = false;

		// Process the notification based on the block type
		let offset = 0;
		while (offset < value.byteLength) {
			const blockId = String.fromCharCode(value.getUint8(offset));
			offset++;

			switch (blockId) {
				case "B": {
					// Bin Type Block
					const strLength = value.getUint8(offset);
					offset++;
					const binTypeBytes = new Uint8Array(value.buffer, offset, strLength);
					const binType = new TextDecoder().decode(binTypeBytes);
					this.dataManager.liveData().setCurrentBinType(binType);
					offset += strLength;
					break;
				}

				case "S": {
					// Scale Weight Block
					const weight = value.getInt16(offset, false); // big-endian
					this.dataManager.liveData().setCurrentWeight(weight);
					offset += 2;
					break;
				}

				case "R": {
					// Current Batch Block
					const strLength = value.getUint8(offset);
					offset++;
					const batchNameBytes = new Uint8Array(
						value.buffer,
						offset,
						strLength
					);
					const batchName = new TextDecoder().decode(batchNameBytes);

					if (batchName.length === 0) {
						// Empty batch name means batch is finished
						// Beep
						this.dataManager.liveData().playDing();

						// End batch
						this.dataManager.batch().endBatch();
					} else {
						// do nothing
					}
					offset += strLength;
					break;
				}

				case "D": {
					// Dump in progress Block
					// This is a simple notification without data
					dumpBlockFound = true;
					this.dataManager.liveData().setDumpInProgress(true);
					break;
				}
			}
		}

		// If no dump block was found, set dump in progress to false
		if (!dumpBlockFound) {
			this.dataManager.liveData().setDumpInProgress(false);
		}
	}

	// Add new method to handle Phone to ESP notifications
	private handlePhoneToEspNotification(event: Event): void {
		const value = (event.target as BluetoothRemoteGATTCharacteristic).value;
		if (!value) {
			console.log("Received empty notification value");
			return;
		}

		console.log(
			"Raw notification data:",
			Array.from(new Uint8Array(value.buffer))
		);
		const numBins = value.getUint8(0);
		console.log("Number of bins:", numBins);

		try {
			// Only proceed if we have enough data for at least one bin
			if (value.byteLength < 24) {
				// Minimum size for one bin entry
				console.log("Notification data too small, ignoring");
				return;
			}

			const binSettings = [];
			let offset = 1; // Start after numBins byte

			// For 'g' command responses, parse bin settings
			for (let i = 0; i < numBins; i++) {
				// Parse bin ID
				const binId = value.getUint8(offset++);

				// Parse ingredient ID
				const ingredientId = value.getUint8(offset++);

				// Parse resistance (double, 8 bytes)
				const resistance = value.getFloat64(offset, false); // big-endian
				offset += 8;

				// Parse open time (2 bytes)
				const openTime = value.getUint16(offset, false);
				offset += 2;

				// Parse slow down time (2 bytes)
				const slowDownTime = value.getUint16(offset, false);
				offset += 2;

				// Parse auger offset (4 bytes)
				const augerOffset = value.getUint32(offset, false);
				offset += 4;

				// Parse auger offset count (4 bytes)
				const augerOffsetCount = value.getUint32(offset, false);
				offset += 4;

				// Parse offset locked (1 byte)
				const offsetLocked = value.getUint8(offset++) === 1;

				// Parse motor reversed (1 byte)
				const motorReversed = value.getUint8(offset++) === 1;

				binSettings.push({
					id: binId,
					ingredientId,
					resistance,
					openTime,
					slowDownTime,
					augerOffset,
					augerOffsetCount,
					offsetLocked,
					motorReversed,
				});
			}

			console.log("Successfully parsed bin settings:", binSettings);
			this.dataManager.binSettings().setBinSettings(binSettings);
			console.log("Bin settings updated in data manager");
		} catch (error) {
			console.error("Error parsing bin settings:", error);
		}
	}

	private handleConsoleNotification(event: Event): void {
		const value = (event.target as BluetoothRemoteGATTCharacteristic).value;
		console.log("Console notification received:", value);
		if (!value) return;

		console.log("value: " + JSON.stringify(value));

		const decoder = new TextDecoder();
		const text = decoder.decode(value);
		this.dataManager.console().addOutput(text);
	}

	async sendCommand(command: CommandId, data?: ArrayBuffer): Promise<void> {
		if (!this.isConnected) {
			try {
				await this.startScanning();
				await this.connect();
			} catch (error) {
				throw new Error(`Failed to establish connection: ${error}`);
			}
		}

		if (!this.phoneToEspChar) {
			throw new Error("BLE characteristic not available");
		}

		const commandByte = new Uint8Array([command.charCodeAt(0)]);
		const finalData = data
			? new Uint8Array([...commandByte, ...new Uint8Array(data)])
			: commandByte;

		await this.phoneToEspChar.writeValueWithResponse(finalData);
	}

	async sendConsoleCommand(data: ArrayBuffer): Promise<void> {
		if (!this.isConnected) {
			try {
				await this.startScanning();
				await this.connect();
			} catch (error) {
				throw new Error(`Failed to establish connection: ${error}`);
			}
		}

		if (!this.consoleChar) {
			throw new Error("Console characteristic not available");
		}

		await this.consoleChar.writeValueWithResponse(data);
		const decoder = new TextDecoder();
		const text = decoder.decode(data);
		this.dataManager.console().addCommand(text);
	}
}
