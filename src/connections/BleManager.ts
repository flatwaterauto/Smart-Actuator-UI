import { DataManager } from "../Data/DataManager";

const SERVICE_UUID = "4fafc201-1fb5-459e-8fcc-c5c9c331914b";
const ESP_TO_PHONE_UUID = "beb5483e-36e1-4688-b7f5-ea07361b26a7";
const PHONE_TO_ESP_UUID = "beb5483e-36e1-4688-b7f5-ea07361b26a8";
const CONSOLE_UUID = "4e45d7b4-51f5-434d-a57c-27ba0e693ebf";

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

	constructor(dataManager: DataManager) {
		this.dataManager = dataManager;
	}

	async startScanning(): Promise<void> {
		try {
			this.device = await navigator.bluetooth.requestDevice({
				filters: [{ namePrefix: "Smart Actuator" }],
				optionalServices: [SERVICE_UUID],
			});

			this.device.addEventListener(
				"gattserverdisconnected",
				this.onDisconnected.bind(this)
			);
		} catch (error) {
			console.error("Error scanning for devices:", error);
			throw error;
		}
	}

	async connect(): Promise<void> {
		if (!this.device) {
			throw new Error("No device selected");
		}

		try {
			this.server = await this.device.gatt!.connect();
			const service = await this.server.getPrimaryService(SERVICE_UUID);

			// Get characteristics
			this.phoneToEspChar = await service.getCharacteristic(PHONE_TO_ESP_UUID);
			this.espToPhoneChar = await service.getCharacteristic(ESP_TO_PHONE_UUID);
			this.consoleChar = await service.getCharacteristic(CONSOLE_UUID);

			// Start notifications for both characteristics
			await this.espToPhoneChar.startNotifications();
			await this.phoneToEspChar.startNotifications();
			await this.consoleChar.startNotifications();

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
		} catch (error) {
			console.error("Connection error:", error);
			throw error;
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
			}
		}
	}

	// Add new method to handle Phone to ESP notifications
	private handlePhoneToEspNotification(event: Event): void {
		const value = (event.target as BluetoothRemoteGATTCharacteristic).value;
		if (!value) return;

		// First byte is number of bins in response
		const numBins = value.getUint8(0);
		let offset = 1;
		const binSettings = [];

		for (let i = 0; i < numBins; i++) {
			// Parse each bin according to protocol:
			// [1 byte] Bin ID
			const binId = value.getUint8(offset++);

			// [4 bytes] Resistor value (float32, big-endian)
			const resistorValue = value.getFloat32(offset, false);
			offset += 4;

			// [1 byte] Ingredient type length
			const typeLength = value.getUint8(offset++);

			// [M bytes] Ingredient type string
			const typeBytes = new Uint8Array(value.buffer, offset, typeLength);
			const ingredientType = new TextDecoder().decode(typeBytes);
			offset += typeLength;

			binSettings.push({
				id: binId,
				ingredient: ingredientType,
				resistorValue: resistorValue,
			});
		}

		this.dataManager.binSettings().setBinSettings(binSettings);
	}

	private handleConsoleNotification(event: Event): void {
		const value = (event.target as BluetoothRemoteGATTCharacteristic).value;
		if (!value) return;

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
