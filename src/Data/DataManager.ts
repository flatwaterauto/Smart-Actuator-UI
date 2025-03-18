//this file handles all persistent data

import { ErrorHandler } from "./Handlers/ErrorHandler";
import { RecipeHandler } from "./Handlers/RecipeHandler";
import { BatchHandler } from "./Handlers/BatchHandler";

export class DataManager {
	private errorHandler: ErrorHandler;
	private recipeHandler: RecipeHandler;
	private batchHandler: BatchHandler;

	constructor() {
		this.errorHandler = new ErrorHandler();
		this.recipeHandler = new RecipeHandler();
		this.batchHandler = new BatchHandler();
	}

	public error() {
		return this.errorHandler;
	}

	public recipe() {
		return this.recipeHandler;
	}

	public batch() {
		return this.batchHandler;
	}
}
