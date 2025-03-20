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

		// Calculate total buffer size
		let totalSize = 2; // Command + recipe name length
		totalSize += recipeNameBytes.length; // Recipe name
		totalSize += 2; // Total quantity
		totalSize += 1; // Number of ingredients
		for (const ingredient of recipe.ingredients) {
			totalSize += 1; // Ingredient name length
			totalSize += encoder.encode(ingredient.name).length; // Ingredient name
			totalSize += 2; // Ingredient quantity
		}

		const buffer = new ArrayBuffer(totalSize);
		const view = new DataView(buffer);
		let offset = 0;

		// Write command ID
		view.setUint8(offset++, "b".charCodeAt(0));

		// Write recipe name
		view.setUint8(offset++, recipeNameBytes.length);
		new Uint8Array(buffer, offset, recipeNameBytes.length).set(recipeNameBytes);
		offset += recipeNameBytes.length;

		// Write total batch quantity
		view.setUint16(offset, quantity, false);
		offset += 2;

		// Write number of ingredients
		view.setUint8(offset++, recipe.ingredients.length);

		// Write each ingredient
		for (const ingredient of recipe.ingredients) {
			const ingredientNameBytes = encoder.encode(ingredient.name);
			view.setUint8(offset++, ingredientNameBytes.length);
			new Uint8Array(buffer, offset, ingredientNameBytes.length).set(
				ingredientNameBytes
			);
			offset += ingredientNameBytes.length;
			view.setUint16(offset, ingredient.quantity, false);
			offset += 2;
		}

		await bleManager.sendCommand(CommandId.StartBatch, buffer);
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
		const encoder = new TextEncoder();
		let totalSize = 2;

		for (const bin of bins) {
			totalSize += 6 + bin.ingredient.length;
		}

		const buffer = new ArrayBuffer(totalSize);
		const view = new DataView(buffer);
		let offset = 0;

		view.setUint8(offset++, "e".charCodeAt(0));
		view.setUint8(offset++, bins.length);

		for (const bin of bins) {
			view.setUint8(offset++, bin.id);
			view.setFloat32(offset, bin.resistorValue, false);
			offset += 4;

			const ingredientBytes = encoder.encode(bin.ingredient);
			view.setUint8(offset++, ingredientBytes.length);
			new Uint8Array(buffer, offset, ingredientBytes.length).set(
				ingredientBytes
			);
			offset += ingredientBytes.length;
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
