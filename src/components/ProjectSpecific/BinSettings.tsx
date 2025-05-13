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
	const latestDataManager = useRef(dataManager);
	const listenerFn = useRef<(() => void) | undefined>(undefined);

	// Keep dataManager ref updated
	useEffect(() => {
		latestDataManager.current = dataManager;
	}, [dataManager]);

	// Create stable update handler
	useEffect(() => {
		listenerFn.current = () => {
			console.log("[BinSettings Component] Update handler called");
			const currentSettings = dataManager.binSettings().getBinSettings();
			console.log("[BinSettings Component] Current settings:", currentSettings);
			setBins(currentSettings);
		};
	}, [dataManager]);

	// Setup listener
	useEffect(() => {
		if (!listenerFn.current) {
			console.error(
				"[BinSettings Component] Listener function not initialized"
			);
			return;
		}

		console.log("[BinSettings Component] Setting up bin settings listener");
		dataManager.binSettings().addListener(listenerFn.current);
		listenerRegistered.current = true;

		return () => {
			console.log("[BinSettings Component] Cleaning up bin settings listener");
			if (listenerFn.current) {
				dataManager.binSettings().removeListener(listenerFn.current);
			}
			listenerRegistered.current = false;
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
			// Store reference to the specific handler instance we're working with
			const binSettingsHandler = dataManager.binSettings();
			console.log(
				"[BinSettings] BinSettingsHandler instance ID:",
				binSettingsHandler
			);

			binSettingsHandler.markAsNotUpdated();
			const success = await requestBinSettings(globalContext);
			if (!success) {
				globalContext.handleError("Failed to send bin settings request");
				return;
			}

			const abortController = new AbortController();
			const cleanup = () => {
				console.log("Cleaning up promises");
				abortController.abort();
			};

			await Promise.race([
				(async () => {
					try {
						console.log("Starting polling loop");
						let attempts = 0;
						// Use the same binSettingsHandler instance we stored earlier
						while (!binSettingsHandler.isUpdated()) {
							if (abortController.signal.aborted) {
								console.log("Polling aborted");
								throw new Error("Polling aborted");
							}
							console.log(`Polling attempt ${++attempts}`);
							await new Promise((resolve) =>
								setTimeout(resolve, BIN_SETTINGS_POLL_INTERVAL)
							);
						}
						console.log("Settings updated successfully");
						cleanup(); // Abort the timeout promise
						return "success";
					} catch (error) {
						console.log("Polling error:", error);
						throw error;
					}
				})(),
				new Promise((_, reject) =>
					setTimeout(() => {
						console.log("Timeout reached!");
						cleanup(); // Abort the polling promise
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
							<div className="checkbox-group">
								<label>Motor Reversed:</label>
								<input
									type="checkbox"
									checked={bin.motorReversed ?? false}
									onChange={(e) =>
										handleBinChange(bin, "motorReversed", e.target.checked)
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
