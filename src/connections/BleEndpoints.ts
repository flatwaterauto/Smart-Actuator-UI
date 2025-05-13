import { CommandId } from "./BleManager";
import type { Recipe } from "../Data/Recipe";
import { GlobalContextType } from "../contexts/GlobalContext";
import { Bin } from "../Data/Handlers/BinSettingsHandler";

//#region phone to esp32

export async function isConnected(
	context: GlobalContextType
): Promise<boolean> {
	const { bleManager, handleError } = context;
	try {
		await bleManager.sendCommand(CommandId.IsConnected);
		return true;
	} catch (error) {
		handleError(error instanceof Error ? error.message : String(error));
		return false;
	}
}

export async function startBatch(
	context: GlobalContextType,
	recipe: Recipe,
	quantity: number
): Promise<boolean> {
	const { bleManager, handleError } = context;
	try {
		const encoder = new TextEncoder();
		const recipeNameBytes = encoder.encode(recipe.name);
		const scale = quantity / 2000; // Calculate scaling factor

		// Calculate total buffer size
		const totalSize =
			1 + // Recipe name length byte
			recipeNameBytes.length + // Recipe name
			1 + // Number of ingredients
			recipe.ingredients.length * 3; // Each ingredient: 1 byte ID + 2 bytes quantity

		const buffer = new ArrayBuffer(totalSize);
		const view = new DataView(buffer);
		let offset = 0;

		// Write recipe name length and name
		view.setUint8(offset++, recipeNameBytes.length);
		new Uint8Array(buffer, offset, recipeNameBytes.length).set(recipeNameBytes);
		offset += recipeNameBytes.length;

		// Write number of ingredients
		view.setUint8(offset++, recipe.ingredients.length);

		// Write each ingredient with scaled quantities
		for (const ingredient of recipe.ingredients) {
			view.setUint8(offset++, ingredient.id); // Ingredient ID (1-12)
			const scaledQuantity = Math.round(ingredient.quantity * scale);
			view.setUint16(offset, scaledQuantity, false); // big-endian
			offset += 2;
		}

		// Print buffer contents
		console.log("===== Buffer Contents =====");
		console.log("Total size:", totalSize, "bytes");
		console.log("Recipe name:", recipe.name);

		const bufferArray = new Uint8Array(buffer);
		console.log("Raw bytes:", Array.from(bufferArray));

		// Print detailed byte interpretation
		console.log("\nDetailed byte breakdown:");
		console.log(`Recipe name length: ${bufferArray[0]}`);
		console.log(
			`Recipe name: ${new TextDecoder().decode(
				bufferArray.slice(1, 1 + bufferArray[0])
			)}`
		);
		console.log(`Number of ingredients: ${bufferArray[1 + bufferArray[0]]}`);

		// Print ingredients
		let pos = 2 + bufferArray[0];
		console.log("\nIngredients:");
		for (let i = 0; i < recipe.ingredients.length; i++) {
			const id = bufferArray[pos];
			const quantity = (bufferArray[pos + 1] << 8) | bufferArray[pos + 2];
			console.log(`Ingredient ${i + 1}: ID=${id}, Quantity=${quantity}`);
			pos += 3;
		}
		console.log("========================");

		await bleManager.sendCommand(CommandId.StartBatch, buffer);
		console.log("Batch started with scale factor:", scale);
		return true;
	} catch (error) {
		handleError(error instanceof Error ? error.message : String(error));
		return false;
	}
}

export async function stopBatch(context: GlobalContextType): Promise<boolean> {
	const { bleManager, handleError } = context;
	try {
		await bleManager.sendCommand(CommandId.StopBatch);
		return true;
	} catch (error) {
		handleError(error instanceof Error ? error.message : String(error));
		return false;
	}
}

export async function startUnloading(
	context: GlobalContextType,
	quantity: number
): Promise<boolean> {
	const { bleManager, handleError } = context;
	try {
		const buffer = new ArrayBuffer(3);
		const view = new DataView(buffer);

		view.setUint8(0, "u".charCodeAt(0));
		view.setUint16(1, quantity, false);

		await bleManager.sendCommand(CommandId.StartUnload, buffer);
		return true;
	} catch (error) {
		handleError(error instanceof Error ? error.message : String(error));
		return false;
	}
}

export async function editBinSettings(
	context: GlobalContextType,
	bins: Bin[]
): Promise<boolean> {
	const { bleManager, handleError } = context;
	try {
		// Calculate total buffer size:
		// 1 byte command + 1 byte num bins +
		// (1 byte id + 1 byte ingredient id + 8 bytes resistance + 2 bytes open time +
		//  2 bytes slow down time + 4 bytes auger offset + 4 bytes auger offset count +
		//  1 byte offset locked + 1 byte motor reversed) * number of bins
		const totalSize = 2 + bins.length * 24; // Updated size to include motor reversed
		const buffer = new ArrayBuffer(totalSize);
		const view = new DataView(buffer);
		let offset = 0;

		// Write command ID and number of bins
		view.setUint8(offset++, "e".charCodeAt(0));
		view.setUint8(offset++, bins.length);

		// Write each bin's data
		for (const bin of bins) {
			view.setUint8(offset++, bin.id);
			view.setUint8(offset++, bin.ingredientId);
			view.setFloat64(offset, bin.resistance, false); // 8 bytes, big-endian
			offset += 8;
			view.setUint16(offset, bin.openTime, false);
			offset += 2;
			view.setUint16(offset, bin.slowDownTime, false);
			offset += 2;
			view.setUint32(offset, bin.augerOffset, false);
			offset += 4;
			view.setUint32(offset, bin.augerOffsetCount, false);
			offset += 4;
			view.setUint8(offset++, bin.offsetLocked ? 1 : 0);
			view.setUint8(offset++, bin.motorReversed ? 1 : 0); // Add motor reversed field
		}

		// Debug: Print entire byte array
		const bufferArray = new Uint8Array(buffer);
		console.log("===== BIN SETTINGS UPDATE =====");
		console.log("Total size:", totalSize, "bytes");
		console.log("Raw bytes:", Array.from(bufferArray));

		// Debug: Print detailed breakdown by bin
		console.log("\nDetailed bin settings breakdown:");
		console.log(`Command ID: 'e' (${bufferArray[0]})`);
		console.log(`Number of bins: ${bufferArray[1]}`);

		let pos = 2; // Start after command ID and bin count
		for (let i = 0; i < bins.length; i++) {
			const bin = bins[i];
			console.log(`\nBin ${i + 1}:`);
			console.log(`  Bin ID: ${bufferArray[pos]} (at offset ${pos})`);
			console.log(
				`  Ingredient ID: ${bufferArray[pos + 1]} (at offset ${pos + 1})`
			);

			// Resistance (8 bytes)
			const resistanceBytes = bufferArray.slice(pos + 2, pos + 10);
			console.log(
				`  Resistance: ${bin.resistance}Ω, bytes: [${Array.from(
					resistanceBytes
				)}] (at offset ${pos + 2})`
			);

			// Open time (2 bytes)
			const openTimeBytes = bufferArray.slice(pos + 10, pos + 12);
			const openTime = (openTimeBytes[0] << 8) | openTimeBytes[1];
			console.log(
				`  Open time: ${openTime}ms, bytes: [${Array.from(
					openTimeBytes
				)}] (at offset ${pos + 10})`
			);

			// Slow down time (2 bytes)
			const slowDownBytes = bufferArray.slice(pos + 12, pos + 14);
			const slowDown = (slowDownBytes[0] << 8) | slowDownBytes[1];
			console.log(
				`  Slow down time: ${slowDown}ms, bytes: [${Array.from(
					slowDownBytes
				)}] (at offset ${pos + 12})`
			);

			// Auger offset (4 bytes)
			const augerOffsetBytes = bufferArray.slice(pos + 14, pos + 18);
			console.log(
				`  Auger offset: ${bin.augerOffset}, bytes: [${Array.from(
					augerOffsetBytes
				)}] (at offset ${pos + 14})`
			);

			// Auger offset count (4 bytes)
			const augerCountBytes = bufferArray.slice(pos + 18, pos + 22);
			console.log(
				`  Auger offset count: ${bin.augerOffsetCount}, bytes: [${Array.from(
					augerCountBytes
				)}] (at offset ${pos + 18})`
			);

			// Offset locked (1 byte)
			console.log(
				`  Offset locked: ${bin.offsetLocked}, byte: ${
					bufferArray[pos + 22]
				} (at offset ${pos + 22})`
			);

			// Motor reversed (1 byte)
			console.log(
				`  Motor reversed: ${bin.motorReversed}, byte: ${
					bufferArray[pos + 23]
				} (at offset ${pos + 23})`
			);

			pos += 24; // Move to next bin
		}
		console.log("==============================");

		await bleManager.sendCommand(CommandId.EditBinSettings, buffer);
		return true;
	} catch (error) {
		handleError(error instanceof Error ? error.message : String(error));
		return false;
	}
}

//#endregion phone to esp32

//#region phone to esp32 and back

// sends a request to get the bin settings
export async function requestBinSettings(
	context: GlobalContextType
): Promise<boolean> {
	const { bleManager, handleError } = context;
	try {
		await bleManager.sendCommand(CommandId.GetBinSettings);
		return true;
	} catch (error) {
		handleError(error instanceof Error ? error.message : String(error));
		return false;
	}
}

//#endregion phone to esp32 and back

//#region console commands

export async function sendConsoleCommand(
	context: GlobalContextType,
	command: string
): Promise<boolean> {
	const { bleManager, handleError } = context;
	try {
		const encoder = new TextEncoder();
		const commandBytes = encoder.encode(command);
		const buffer = new ArrayBuffer(commandBytes.length);
		const view = new Uint8Array(buffer);
		view.set(commandBytes);

		await bleManager.sendConsoleCommand(buffer);
		return true;
	} catch (error) {
		handleError(error instanceof Error ? error.message : String(error));
		return false;
	}
}

//#endregion console commands
