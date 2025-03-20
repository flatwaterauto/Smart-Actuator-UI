//this file handles all persistent data

import { ErrorHandler } from "./Handlers/ErrorHandler";
import { RecipeHandler } from "./Handlers/RecipeHandler";
import { BatchHandler } from "./Handlers/BatchHandler";
import { BinSettingsHandler } from "./Handlers/BinSettingsHandler";
import { LiveDataHandler } from "./Handlers/LiveDataHandler";
import { ConsoleHandler } from "./Handlers/ConsoleHandler";

export class DataManager {
	private errorHandler: ErrorHandler;
	private recipeHandler: RecipeHandler;
	private batchHandler: BatchHandler;
	private binSettingsHandler: BinSettingsHandler;
	private liveDataHandler: LiveDataHandler;
	private consoleHandler: ConsoleHandler;

	constructor() {
		this.errorHandler = new ErrorHandler();
		this.recipeHandler = new RecipeHandler();
		this.batchHandler = new BatchHandler();
		this.binSettingsHandler = new BinSettingsHandler();
		this.liveDataHandler = new LiveDataHandler();
		this.consoleHandler = new ConsoleHandler();
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

	public binSettings() {
		return this.binSettingsHandler;
	}

	public liveData() {
		return this.liveDataHandler;
	}

	public console() {
		return this.consoleHandler;
	}
}
