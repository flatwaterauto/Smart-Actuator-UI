import { useState, useEffect, useRef } from "react";
import FormLayout from "../components/Layout/FormLayout";
import { sendConsoleCommand } from "../connections/BleEndpoints";
import "./ConsoleForm.css";
import { useGlobalContext } from "../contexts/GlobalContext";
import { DataManager } from "../Data/DataManager";
import { CommandParameter } from "../Data/Handlers/ConsoleHandler";

interface ConsoleFormProps {
	onBack: () => void;
	dataManager: DataManager;
}

function ConsoleForm({ onBack, dataManager }: ConsoleFormProps) {
	const globalContext = useGlobalContext();
	const [command, setCommand] = useState("");
	const [selectedCommand, setSelectedCommand] = useState("");
	const [parameters, setParameters] = useState<Record<number, string>>({});
	const [entries, setEntries] = useState(dataManager.console().getAllEntries());
	const availableCommands = dataManager.console().getAvailableCommands();
	const [requestingCommands, setRequestingCommands] = useState(false);
	const currentPageRef = useRef(0); // Start at page 0 instead of 1
	const waitingForResponseRef = useRef(false);
	const lastProcessedEntryRef = useRef<number>(0);

	useEffect(() => {
		const handleUpdate = () => {
			setEntries(dataManager.console().getAllEntries());

			// Check for new pong responses
			if (requestingCommands && waitingForResponseRef.current) {
				const allEntries = dataManager.console().getAllEntries();

				// Log the entries for debugging
				console.log(
					"Current entries:",
					allEntries.length,
					"Last processed:",
					lastProcessedEntryRef.current
				);

				// Check newest entries first for efficiency
				for (
					let i = allEntries.length - 1;
					i >= lastProcessedEntryRef.current;
					i--
				) {
					const entry = allEntries[i];

					if (entry.type === "output" && entry.text.startsWith("pong:")) {
						console.log("Found pong response:", entry.text, "at index", i);
						lastProcessedEntryRef.current = allEntries.length;
						handlePongReceived();
						break; // Only process one pong at a time
					}
				}
			}
		};

		dataManager.console().addListener(handleUpdate);
		return () => {
			dataManager.console().removeListener(handleUpdate);
		};
	}, [dataManager, requestingCommands]);

	// Handle a received pong response
	const handlePongReceived = () => {
		// We got a response, no longer waiting
		waitingForResponseRef.current = false;

		const isLastPage = dataManager.console().isLastPageReceived();
		console.log(
			`Received page ${currentPageRef.current}, isLastPage: ${isLastPage}`
		);

		if (isLastPage) {
			setRequestingCommands(false);
			console.log("All command pages received");
		} else {
			// Request next page immediately since we already have the response
			const nextPage = currentPageRef.current + 1;
			console.log(`Preparing to request page ${nextPage}`);
			currentPageRef.current = nextPage;

			// Request the next page immediately without timeout
			requestNextPage(nextPage);
		}
	};

	const handleCommandSelect = (newCommand: string) => {
		setSelectedCommand(newCommand);

		if (newCommand) {
			const params = availableCommands[newCommand];
			if (params) {
				const initialValues = params.reduce((acc, param, index) => {
					if (
						param.type === "dropdown" &&
						param.options &&
						param.defaultIndex !== undefined
					) {
						acc[index] = param.options[param.defaultIndex];
					} else if (param.defaultValue !== undefined) {
						acc[index] = String(param.defaultValue);
					}
					return acc;
				}, {} as Record<number, string>);
				setParameters(initialValues);
			}
		} else {
			setParameters({});
		}
	};

	const handleParameterChange = (index: number, value: string) => {
		setParameters((prev) => ({
			...prev,
			[index]: value,
		}));
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (selectedCommand) {
			const paramValues =
				availableCommands[selectedCommand]?.map(
					(param, index) => parameters[index] || String(param.defaultValue)
				) || [];
			const fullCommand = [selectedCommand, ...paramValues].join(";");
			await sendConsoleCommand(globalContext, fullCommand);
		} else if (command.trim()) {
			await sendConsoleCommand(globalContext, command);
		}
		setCommand("");
		setParameters({});
	};

	const requestNextPage = async (page: number) => {
		console.log(
			`Attempting to request page ${page}, waitingForResponse: ${waitingForResponseRef.current}`
		);

		// Only send if we're not already waiting for a response
		if (!waitingForResponseRef.current) {
			console.log(`Sending PING:${page} request`);
			waitingForResponseRef.current = true;
			try {
				await sendConsoleCommand(globalContext, `PING:${page}`);
				console.log(`PING:${page} request sent successfully`);
			} catch (error) {
				console.error(`Error sending PING:${page}:`, error);
				waitingForResponseRef.current = false; // Reset waiting flag on error
			}
		} else {
			console.log(
				`Skipping page ${page} request - still waiting for previous response`
			);
		}
	};

	const handleRequestCommands = async () => {
		console.log("Starting command request sequence");
		dataManager.console().clearAvailableCommands();
		setRequestingCommands(true);
		currentPageRef.current = 0;
		waitingForResponseRef.current = false;
		lastProcessedEntryRef.current = 0; // Reset to check all entries

		// Request the first page (page 0)
		await requestNextPage(0);
	};

	const handleClearConsole = () => {
		dataManager.console().clear();
	};

	const renderParameter = (param: CommandParameter, index: number) => {
		const value =
			parameters[index] ??
			(param.type === "dropdown" &&
			param.options &&
			param.defaultIndex !== undefined
				? param.options[param.defaultIndex]
				: String(param.defaultValue ?? ""));

		switch (param.type) {
			case "dropdown":
				return (
					<select
						className="parameter-input"
						value={value}
						onChange={(e) => handleParameterChange(index, e.target.value)}
					>
						{param.options?.map((option, i) => (
							<option key={i} value={option}>
								{option}
							</option>
						))}
					</select>
				);
			case "number":
				return (
					<input
						type="number"
						className="parameter-input"
						value={value}
						onChange={(e) => handleParameterChange(index, e.target.value)}
						placeholder={param.label}
					/>
				);
			case "text":
				return (
					<input
						type="text"
						className="parameter-input"
						value={value}
						onChange={(e) => handleParameterChange(index, e.target.value)}
						placeholder={param.label}
					/>
				);
		}
	};

	return (
		<FormLayout title="Debug Console" onBack={onBack}>
			<div className="console-form">
				<div className="console-history">
					{entries
						.filter(
							(entry) =>
								!(entry.type === "output" && "hidden" in entry && entry.hidden)
						)
						.map((entry, i) => (
							<div
								key={i}
								className={
									entry.type === "command"
										? "console-command"
										: "console-output"
								}
							>
								{entry.type === "command" ? `> ${entry.text}` : entry.text}
							</div>
						))}
				</div>
				<form onSubmit={handleSubmit} className="console-input">
					<select
						className="command-selector"
						value={selectedCommand}
						onChange={(e) => handleCommandSelect(e.target.value)}
					>
						<option value="">Manual Command Entry</option>
						{Object.keys(availableCommands).map((cmd) => (
							<option key={cmd} value={cmd}>
								{cmd}
							</option>
						))}
					</select>

					{!selectedCommand && (
						<input
							type="text"
							className="parameter-input"
							value={command}
							onChange={(e) => setCommand(e.target.value)}
							placeholder="Enter manual command..."
						/>
					)}

					{selectedCommand &&
						availableCommands[selectedCommand]?.map((param, index) => (
							<div key={index} className="parameter-group">
								<div className="parameter-label">
									{param.label || `Parameter ${index + 1}`}
								</div>
								{renderParameter(param, index)}
							</div>
						))}

					<div className="command-buttons">
						<button type="submit" className="standard-button">
							Send
						</button>
						<button
							type="button"
							className="standard-button"
							onClick={handleRequestCommands}
							disabled={requestingCommands}
						>
							{requestingCommands ? "Loading Commands..." : "Request Commands"}
						</button>
						<button
							type="button"
							className="standard-button"
							onClick={handleClearConsole}
						>
							Clear Console
						</button>
					</div>
				</form>
			</div>
		</FormLayout>
	);
}

export default ConsoleForm;
