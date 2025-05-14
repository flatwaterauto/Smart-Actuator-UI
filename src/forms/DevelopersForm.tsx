import React, { useState, useEffect } from "react";
import FormLayout from "../components/Layout/FormLayout";
import "./DevelopersForm.css";
import "../components/Layout/Formatting.css";
import { DataManager } from "../Data/DataManager";

interface DevelopersFormProps {
	onBack: () => void;
	onSettings: () => void;
	onConsole: () => void;
	dataManager: DataManager;
}

function DevelopersForm({
	onBack,
	onSettings,
	onConsole,
	dataManager,
}: DevelopersFormProps) {
	const [volume, setVolume] = useState(dataManager.liveData().getDingVolume());

	// Update volume when slider changes
	const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const newVolume = parseFloat(e.target.value);
		setVolume(newVolume);
		dataManager.liveData().setDingVolume(newVolume);
		dataManager.liveData().playDing(); // Play sound at new volume
	};

	// Listen for changes from other components
	useEffect(() => {
		const handleDataChange = () => {
			setVolume(dataManager.liveData().getDingVolume());
		};

		dataManager.liveData().addListener(handleDataChange);
		return () => {
			dataManager.liveData().removeListener(handleDataChange);
		};
	}, [dataManager]);

	return (
		<FormLayout title="Developer Menu" onBack={onBack}>
			<div className="volume-control-container">
				<label htmlFor="volume-slider">
					Notification Sound Volume: {Math.round(volume * 100)}%
				</label>
				<input
					id="volume-slider"
					type="range"
					min="0"
					max="1"
					step="0.01"
					value={volume}
					onChange={handleVolumeChange}
					className="volume-slider"
				/>
			</div>

			<div className="button-container">
				<button className="standard-button" onClick={onSettings}>
					Settings
				</button>
				<button className="standard-button" onClick={onConsole}>
					Console
				</button>
			</div>
		</FormLayout>
	);
}

export default DevelopersForm;
