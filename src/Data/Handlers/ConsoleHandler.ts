// Base interface for console entries that contains common properties
export interface BaseConsoleEntry {
	text: string; // The actual text content of the entry
	timestamp: Date; // When the entry was created
}

// Interface for commands sent to the console
export interface ConsoleCommand extends BaseConsoleEntry {
	type: "command"; // Discriminator to identify command entries
}

// Interface for output received from the console
export interface ConsoleOutput extends BaseConsoleEntry {
	type: "output"; // Discriminator to identify output entries
}

// Union type of all possible console entry types
export type ConsoleEntry = ConsoleCommand | ConsoleOutput;

// Interface for command parameters
export interface CommandParameter {
	type: "dropdown" | "number" | "text";
	options?: string[];
	defaultIndex?: number;
	label?: string;
	defaultValue?: number | string;
}

// Interface for a list of commands and their parameters
export interface CommandList {
	[key: string]: CommandParameter[];
}

let testList: CommandList = {
	test: [
		{
			type: "dropdown",
			options: ["one", "two", "three"],
			defaultIndex: 1,
		},
		{
			type: "number",
			label: "Number",
			defaultValue: 42,
		},
		{
			type: "text",
			label: "Text",
			defaultValue: "Hello, world!",
		},
	],
	test2: [
		{
			type: "dropdown",
			options: ["yes", "no"],
			defaultIndex: 0,
		},
	],
};

// Handles console input/output and manages history
export class ConsoleHandler {
	// Arrays to store command and output history
	private commands: ConsoleEntry[] = [];
	private outputs: ConsoleEntry[] = [];
	// Maximum number of entries to keep in history
	private maxEntries: number = 100;
	// Callbacks for when entries are added/removed
	private listeners: ((entries: ConsoleEntry[]) => void)[] = [];

	// Available commands and their parameters
	private availableCommands: CommandList = { ...testList };

	// Adds a new command to the history
	public addCommand(command: string): void {
		this.commands.push({
			text: command,
			timestamp: new Date(),
			type: "command",
		});

		// Maintain max history size
		if (this.commands.length > this.maxEntries) {
			this.commands = this.commands.slice(-this.maxEntries);
		}

		this.notifyListeners();
	}

	// Adds a new output to the history
	public addOutput(output: string): void {
		// Check if output is a command list
		if (output.startsWith("pong:")) {
			// Add debug message showing original received string
			console.log(output);

			try {
				const commandString = output.substring(5).trim(); // Remove "pong:" prefix
				this.availableCommands = parseCommands(commandString);
			} catch (error) {
				this.outputs.push({
					text: `Error parsing commands: ${
						error instanceof Error ? error.message : String(error)
					}`,
					timestamp: new Date(),
					type: "output",
				});
			}
		} else {
			this.outputs.push({
				text: output,
				timestamp: new Date(),
				type: "output",
			});
		}

		// Maintain max history size
		if (this.outputs.length > this.maxEntries) {
			this.outputs = this.outputs.slice(-this.maxEntries);
		}

		this.notifyListeners();
	}

	public getAvailableCommands(): CommandList {
		return { ...this.availableCommands };
	}

	// Retrieves the command history
	public getCommands(): ConsoleEntry[] {
		return [...this.commands];
	}

	// Retrieves the output history
	public getOutputs(): ConsoleEntry[] {
		return [...this.outputs];
	}

	// Retrieves all entries (commands and outputs) sorted by timestamp
	public getAllEntries(): ConsoleEntry[] {
		// Combine and sort all entries by timestamp
		return [...this.commands, ...this.outputs].sort(
			(a, b) => a.timestamp.getTime() - b.timestamp.getTime()
		);
	}

	// Clears all command and output history
	public clear(): void {
		this.commands = [];
		this.outputs = [];
		this.notifyListeners();
	}

	// Adds a listener to be notified when entries are added/removed
	public addListener(listener: (entries: ConsoleEntry[]) => void): void {
		this.listeners.push(listener);
	}

	// Removes a previously added listener
	public removeListener(listener: (entries: ConsoleEntry[]) => void): void {
		this.listeners = this.listeners.filter((l) => l !== listener);
	}

	// Notifies all listeners of the current entries
	private notifyListeners(): void {
		const entries = this.getAllEntries();
		this.listeners.forEach((listener) => listener(entries));
	}
}

// Parses a string of commands and parameters into a CommandList object
function parseCommands(commandString: string): CommandList {
	const lines = commandString.trim().split("\n");
	const commands: CommandList = {};

	lines.forEach((line) => {
		const [commandName, ...params] = line.split(";");
		commands[commandName] = params.map((param): CommandParameter => {
			if (param.startsWith("<drop>")) {
				const match = param.match(/<drop>([^|]+)\|(\d+)/);
				if (!match) throw new Error("Invalid dropdown format");
				const [_, options, defaultIndex] = match;
				return {
					type: "dropdown",
					options: options.split(","),
					defaultIndex: parseInt(defaultIndex),
				};
			} else if (param.startsWith("<num>")) {
				const match = param.match(/<num>([^|]+)\|(\d+)/);
				if (!match) throw new Error("Invalid number format");
				const [_, label, defaultValue] = match;
				return {
					type: "number",
					label,
					defaultValue: parseFloat(defaultValue),
				};
			} else if (param.startsWith("<text>")) {
				const match = param.match(/<text>([^|]+)\|([^;]*)/);
				if (!match) throw new Error("Invalid text format");
				const [_, label, defaultValue] = match;
				return {
					type: "text",
					label,
					defaultValue: defaultValue,
				};
			}
			throw new Error("Unknown parameter type");
		});
	});

	return commands;
}
