import { useState, useEffect, useRef } from "react";
import "./CalibrateForm.css";
import "../components/Layout/Formatting.css";
import FormLayout from "../components/Layout/FormLayout";
import { DataManager } from "../Data/DataManager";
import {
	requestBinSettings,
	editBinSettings,
} from "../connections/BleEndpoints";
import { useGlobalContext } from "../contexts/GlobalContext";
import { Bin } from "../Data/Handlers/BinSettingsHandler";
import { ingredientMapping } from "../Data/Recipe";

interface Props {
	dataManager: DataManager;
	onBack?: () => void;
}

function CalibrateForm({ dataManager, onBack }: Props) {
	const globalContext = useGlobalContext();
	// Values stored in milliseconds (0-15000ms = 0-15s)
	const [openTime, setOpenTime] = useState(1000); // Default 1 second
	const [slowDownTime, setSlowDownTime] = useState(500); // Default 0.5 seconds
	// Separate state for input fields
	const [openTimeInput, setOpenTimeInput] = useState("1.00");
	const [slowDownTimeInput, setSlowDownTimeInput] = useState("0.50");

	const [currentBin, setCurrentBin] = useState<Bin | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const listenerFn = useRef<(() => void) | null>(null);
	const currentBinType = dataManager.liveData().getCurrentBinType();

	// Format milliseconds to seconds with 2 decimal places
	const formatTimeToSeconds = (milliseconds: number) => {
		return (milliseconds / 1000).toFixed(2);
	};

	// Update input values when the actual times change
	useEffect(() => {
		setOpenTimeInput(formatTimeToSeconds(openTime));
	}, [openTime]);

	useEffect(() => {
		setSlowDownTimeInput(formatTimeToSeconds(slowDownTime));
	}, [slowDownTime]);

	// When open time changes, ensure slow down time doesn't exceed it
	useEffect(() => {
		if (slowDownTime > openTime) {
			setSlowDownTime(openTime);
		}
	}, [openTime, slowDownTime]);

	// Load bin data when button is pressed
	const loadBinData = async () => {
		if (currentBinType === "None") {
			globalContext.handleError("No bin selected");
			return;
		}

		setIsLoading(true);
		try {
			// Register listener
			if (listenerFn.current) {
				dataManager.binSettings().addListener(listenerFn.current);
			}

			// Request bin settings
			dataManager.binSettings().markAsNotUpdated();
			await requestBinSettings(globalContext);
		} catch (error) {
			console.error("Failed to load bin data:", error);
			globalContext.handleError("Failed to load bin settings");
		} finally {
			setIsLoading(false);
		}
	};

	// Setup listener function for bin settings updates
	useEffect(() => {
		listenerFn.current = () => {
			if (currentBinType !== "None") {
				const bins = dataManager.binSettings().getBinSettings();
				// Find the bin with matching ingredient name
				const matchingBin = bins.find(
					(bin) =>
						ingredientMapping[
							bin.ingredientId as keyof typeof ingredientMapping
						] === currentBinType
				);

				if (matchingBin) {
					setCurrentBin(matchingBin);
					setOpenTime(matchingBin.openTime);
					setSlowDownTime(matchingBin.slowDownTime);
				}
			}
		};

		return () => {
			if (listenerFn.current) {
				dataManager.binSettings().removeListener(listenerFn.current);
			}
			listenerFn.current = null;
		};
	}, [dataManager, currentBinType]);

	// Handle open time input changes (only updates display)
	const handleOpenTimeInputChange = (
		e: React.ChangeEvent<HTMLInputElement>
	) => {
		setOpenTimeInput(e.target.value);
	};

	// Apply open time when input loses focus
	const handleOpenTimeBlur = () => {
		const seconds = parseFloat(openTimeInput);
		if (!isNaN(seconds) && seconds >= 0 && seconds <= 15) {
			setOpenTime(Math.round(seconds * 1000)); // Convert seconds to milliseconds
		} else {
			// Reset to valid value if input was invalid
			setOpenTimeInput(formatTimeToSeconds(openTime));
		}
	};

	// Handle slow down time input changes (only updates display)
	const handleSlowDownTimeInputChange = (
		e: React.ChangeEvent<HTMLInputElement>
	) => {
		setSlowDownTimeInput(e.target.value);
	};

	// Apply slow down time when input loses focus
	const handleSlowDownTimeBlur = () => {
		const seconds = parseFloat(slowDownTimeInput);
		if (!isNaN(seconds) && seconds >= 0 && seconds <= openTime / 1000) {
			setSlowDownTime(Math.round(seconds * 1000)); // Convert seconds to milliseconds
		} else {
			// Reset to valid value if input was invalid
			setSlowDownTimeInput(formatTimeToSeconds(slowDownTime));
		}
	};

	// Handle open time change
	const handleOpenTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const newOpenTimeMs = parseInt(e.target.value);
		setOpenTime(newOpenTimeMs);
	};

	// Handle slow down time change
	const handleSlowDownTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const newSlowDownTimeMs = parseInt(e.target.value);
		// Ensure slow down time doesn't exceed open time
		if (newSlowDownTimeMs <= openTime) {
			setSlowDownTime(newSlowDownTimeMs);
		} else {
			setSlowDownTime(openTime);
		}
	};

	// Handle save calibration
	const handleSaveCalibration = async () => {
		if (!currentBin) {
			return;
		}

		setIsSaving(true);
		try {
			// Update the bin locally first
			const updatedBin = {
				...currentBin,
				openTime,
				slowDownTime,
			};

			dataManager.binSettings().updateBinSetting(updatedBin);

			// Get all bins and send them to ESP32
			const allBins = dataManager.binSettings().getBinSettings();
			const success = await editBinSettings(globalContext, allBins);

			if (!success) {
				globalContext.handleError("Failed to save calibration");
			} else {
				console.log(
					`Saved: Open=${openTime}ms, SlowDown=${slowDownTime}ms for bin ${currentBin.id}`
				);
			}
		} catch (error) {
			globalContext.handleError(
				error instanceof Error ? error.message : "Failed to save calibration"
			);
		} finally {
			setIsSaving(false);
		}
	};

	return (
		<FormLayout title="Calibrate Bin" onBack={onBack}>
			<div className="calibrate-container">
				{/* Display current bin info - always visible */}
				<div className="current-bin-info">
					<h2>Current Bin: {currentBinType}</h2>
					{currentBin && <p>Bin ID: {currentBin.id}</p>}
					<button
						className="standard-button"
						onClick={loadBinData}
						disabled={isLoading || currentBinType === "None"}
					>
						{isLoading ? "Loading..." : "Load Calibration"}
					</button>
				</div>

				{/* Only show controls when a bin is selected */}
				{currentBin && (
					<>
						<div className="sliders-container">
							<div className="slider-group">
								<div className="time-display">
									<input
										type="number"
										value={openTimeInput}
										onChange={handleOpenTimeInputChange}
										onBlur={handleOpenTimeBlur}
										min="0"
										max="15"
										step="0.01"
									/>
									s
								</div>
								<div className="slider-container open-slider">
									<span className="slider-label">Open Time</span>
									<input
										type="range"
										min="0"
										max="15000"
										step="10"
										value={openTime}
										onChange={handleOpenTimeChange}
										className="vertical-slider inverted"
									/>
								</div>
							</div>

							<div className="slider-group">
								<div className="time-display">
									<input
										type="number"
										value={slowDownTimeInput}
										onChange={handleSlowDownTimeInputChange}
										onBlur={handleSlowDownTimeBlur}
										min="0"
										max={formatTimeToSeconds(openTime)}
										step="0.01"
									/>
									s
								</div>
								<div className="slider-container close-slider">
									<span className="slider-label">Slow Down Time</span>
									<input
										type="range"
										min="0"
										max={openTime}
										step="10"
										value={slowDownTime}
										onChange={handleSlowDownTimeChange}
										className="vertical-slider"
									/>
								</div>
							</div>
						</div>

						<div className="calibrate-info">
							<p>
								Open Time: {formatTimeToSeconds(openTime)} seconds ({openTime}{" "}
								ms)
							</p>
							<p>
								Slow Down Time: {formatTimeToSeconds(slowDownTime)} seconds (
								{slowDownTime} ms)
							</p>
						</div>

						<div className="button-container">
							<button
								className="standard-button"
								onClick={handleSaveCalibration}
								disabled={isSaving}
							>
								{isSaving ? "Saving..." : "Save Calibration"}
							</button>
						</div>
					</>
				)}
			</div>
		</FormLayout>
	);
}

export default CalibrateForm;
