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
		//  1 byte offset locked) * number of bins
		const totalSize = 2 + bins.length * 23;
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
		}

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
