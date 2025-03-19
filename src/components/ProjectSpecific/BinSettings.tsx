import { useEffect, useState } from "react";
import {
	requestBinSettings,
	editBinSettings,
} from "../../connections/BleEndpoints";
import "./BinSettings.css";
import Spinner from "./Spinner";
import { useGlobalContext } from "../../contexts/GlobalContext";
import { DataManager } from "../../Data/DataManager";
import { Bin } from "../../Data/Handlers/BinSettingsHandler";

const BIN_SETTINGS_TIMEOUT = 5000; // 5 seconds timeout
const BIN_SETTINGS_POLL_INTERVAL = 100; // Check every 100ms

export function BinSettings({ dataManager }: { dataManager: DataManager }) {
	const globalContext = useGlobalContext();
	const [isSaving, setIsSaving] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [expandedBins, setExpandedBins] = useState<Set<number>>(new Set());

	const handleLoadSettings = async () => {
		setIsLoading(true);
		try {
			dataManager.binSettings().markAsNotUpdated();
			const success = await requestBinSettings(globalContext);
			if (!success) {
				globalContext.handleError("Failed to send bin settings request");
				return;
			}

			await Promise.race([
				(async () => {
					while (!dataManager.binSettings().isUpdated()) {
						await new Promise((resolve) =>
							setTimeout(resolve, BIN_SETTINGS_POLL_INTERVAL)
						);
					}
				})(),
				new Promise((_, reject) =>
					setTimeout(() => reject(new Error("Timeout")), BIN_SETTINGS_TIMEOUT)
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
		value: string | number
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

	const bins = dataManager.binSettings().getBinSettings();

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
							Bin {bin.id} - {bin.ingredient || "Empty"}
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
								<input
									type="text"
									value={bin.ingredient}
									onChange={(e) =>
										handleBinChange(bin, "ingredient", e.target.value)
									}
								/>
							</div>
							<div>
								<label>Resistor Value (Ω):</label>
								<input
									type="number"
									value={bin.resistorValue}
									onChange={(e) =>
										handleBinChange(
											bin,
											"resistorValue",
											Number(e.target.value)
										)
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
