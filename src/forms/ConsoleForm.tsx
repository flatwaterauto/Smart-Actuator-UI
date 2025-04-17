import { useState, useEffect } from "react";
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

	useEffect(() => {
		const handleUpdate = () => {
			setEntries(dataManager.console().getAllEntries());
		};

		dataManager.console().addListener(handleUpdate);
		return () => dataManager.console().removeListener(handleUpdate);
	}, [dataManager]);

	// Handle parameter initialization in the onChange handler instead of useEffect
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

	const handleRequestCommands = async () => {
		await sendConsoleCommand(globalContext, "ping");
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
					{entries.map((entry, i) => (
						<div
							key={i}
							className={
								entry.type === "command" ? "console-command" : "console-output"
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
						>
							Request Commands
						</button>
					</div>
				</form>
			</div>
		</FormLayout>
	);
}

export default ConsoleForm;
