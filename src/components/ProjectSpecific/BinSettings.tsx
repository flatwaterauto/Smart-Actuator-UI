import { useState, useEffect, useRef } from "react";
import {
	requestBinSettings,
	editBinSettings,
} from "../../connections/BleEndpoints";
import "./BinSettings.css";
import Spinner from "./Spinner";
import { useGlobalContext } from "../../contexts/GlobalContext";
import { DataManager } from "../../Data/DataManager";
import { Bin } from "../../Data/Handlers/BinSettingsHandler";
import { ingredientMapping } from "../../Data/Recipe";

const BIN_SETTINGS_TIMEOUT = 5000; // 5 seconds timeout
const BIN_SETTINGS_POLL_INTERVAL = 100; // Check every 100ms

export function BinSettings({ dataManager }: { dataManager: DataManager }) {
	const globalContext = useGlobalContext();
	const [isSaving, setIsSaving] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [expandedBins, setExpandedBins] = useState<Set<number>>(new Set());
	const [bins, setBins] = useState<Bin[]>(
		dataManager.binSettings().getBinSettings()
	);
	const listenerRegistered = useRef(false);

	// Setup listener first
	useEffect(() => {
		console.log("Setting up bin settings listener");

		const handleUpdate = () => {
			console.log("Bin settings update handler called");
			const currentSettings = dataManager.binSettings().getBinSettings();
			console.log("Current settings:", currentSettings);
			setBins(currentSettings);
		};

		// Store reference to avoid closure issues
		const listenerFn = handleUpdate.bind(null);
		dataManager.binSettings().addListener(listenerFn);
		listenerRegistered.current = true;

		console.log("Listener setup complete");

		return () => {
			console.log("Cleaning up bin settings listener");
			listenerRegistered.current = false;
			dataManager.binSettings().removeListener(listenerFn);
		};
	}, [dataManager]);

	// Handle loading settings
	const handleLoadSettings = async () => {
		if (!listenerRegistered.current) {
			console.log("Cannot load settings - listener not registered");
			globalContext.handleError("Internal error: listener not ready");
			return;
		}

		setIsLoading(true);
		try {
			console.log("Starting load settings process with active listener");
			dataManager.binSettings().markAsNotUpdated();
			const success = await requestBinSettings(globalContext);
			if (!success) {
				globalContext.handleError("Failed to send bin settings request");
				return;
			}

			await Promise.race([
				(async () => {
					console.log("Starting polling loop");
					let attempts = 0;
					while (!dataManager.binSettings().isUpdated()) {
						console.log(`Polling attempt ${++attempts}`);
						await new Promise((resolve) =>
							setTimeout(resolve, BIN_SETTINGS_POLL_INTERVAL)
						);
					}
					console.log("Settings updated successfully");
				})(),
				new Promise((_, reject) =>
					setTimeout(() => {
						console.log("Timeout reached!");
						reject(new Error("Timeout waiting for bin settings"));
					}, BIN_SETTINGS_TIMEOUT)
				),
			]);
		} catch (error) {
			globalContext.handleError(
				error instanceof Error
					? error.message
					: "Failed to get response from device"
			);
		} finally {
			setIsLoading(false);
		}
	};

	const handleBinChange = (
		bin: Bin,
		field: keyof Bin,
		value: string | number | boolean
	) => {
		dataManager.binSettings().updateBinSetting({
			...bin,
			[field]: value,
		});
	};

	const handleSave = async () => {
		setIsSaving(true);
		try {
			const bins = dataManager.binSettings().getBinSettings();
			const success = await editBinSettings(globalContext, bins);
			if (!success) {
				globalContext.handleError("Failed to save bin settings");
			}
		} catch (error) {
			globalContext.handleError(
				error instanceof Error ? error.message : String(error)
			);
		} finally {
			setIsSaving(false);
		}
	};

	const toggleBin = (binId: number) => {
		setExpandedBins((prev) => {
			const next = new Set(prev);
			if (next.has(binId)) {
				next.delete(binId);
			} else {
				next.add(binId);
			}
			return next;
		});
	};

	const getIngredientName = (id: number): string => {
		return ingredientMapping[id as keyof typeof ingredientMapping] || "Empty";
	};

	return (
		<div className="bin-settings">
			<button
				className="standard-button"
				onClick={handleLoadSettings}
				disabled={isLoading}
				style={{ marginBottom: "1rem" }}
			>
				{isLoading ? (
					<>
						Loading Settings...
						<br />
						<br />
						<Spinner />
					</>
				) : (
					"Load Bin Settings"
				)}
			</button>

			{bins.map((bin) => (
				<div key={bin.id} className="bin-item">
					<div className="bin-header" onClick={() => toggleBin(bin.id)}>
						<span>
							Bin {bin.id} - {getIngredientName(bin.ingredientId)}
						</span>
						<span
							className={`collapse-arrow ${
								expandedBins.has(bin.id) ? "expanded" : ""
							}`}
						>
							▼
						</span>
					</div>
					{expandedBins.has(bin.id) && (
						<div className="bin-content">
							<div>
								<label>Ingredient:</label>
								<select
									value={bin.ingredientId}
									onChange={(e) =>
										handleBinChange(bin, "ingredientId", Number(e.target.value))
									}
								>
									{(
										Object.entries(ingredientMapping) as [string, string][]
									).map(([id, name]) => (
										<option key={id} value={id}>
											{name}
										</option>
									))}
								</select>
							</div>
							<div>
								<label>Resistance (Ω):</label>
								<input
									type="number"
									value={bin.resistance}
									onChange={(e) =>
										handleBinChange(bin, "resistance", Number(e.target.value))
									}
									step="0.1"
								/>
							</div>
							<div>
								<label>Open Time (ms):</label>
								<input
									type="number"
									value={bin.openTime}
									onChange={(e) =>
										handleBinChange(bin, "openTime", Number(e.target.value))
									}
									min="0"
									max="65535"
								/>
							</div>
							<div>
								<label>Slow Down Time (ms):</label>
								<input
									type="number"
									value={bin.slowDownTime}
									onChange={(e) =>
										handleBinChange(bin, "slowDownTime", Number(e.target.value))
									}
									min="0"
									max="65535"
								/>
							</div>
							<div>
								<label>Auger Offset:</label>
								<input
									type="number"
									value={bin.augerOffset}
									onChange={(e) =>
										handleBinChange(bin, "augerOffset", Number(e.target.value))
									}
									min="0"
								/>
							</div>
							<div>
								<label>Offset Count:</label>
								<input
									type="number"
									value={bin.augerOffsetCount}
									onChange={(e) =>
										handleBinChange(
											bin,
											"augerOffsetCount",
											Number(e.target.value)
										)
									}
									min="0"
								/>
							</div>
							<div className="checkbox-group">
								<label>Offset Locked:</label>
								<input
									type="checkbox"
									checked={bin.offsetLocked}
									onChange={(e) =>
										handleBinChange(bin, "offsetLocked", e.target.checked)
									}
								/>
							</div>
						</div>
					)}
				</div>
			))}
			<button
				className="standard-button"
				onClick={handleSave}
				disabled={isSaving}
			>
				{isSaving ? (
					<>
						Saving...
						<br />
						<br />
						<Spinner />
					</>
				) : (
					"Save Changes"
				)}
			</button>
		</div>
	);
}
