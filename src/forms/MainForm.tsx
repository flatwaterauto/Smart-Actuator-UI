import { useState, useEffect } from "react";
import "./MainForm.css";
import "../components/Layout/Formatting.css";
import InfoPreview from "../components/ProjectSpecific/InfoPreview";
import FormLayout from "../components/Layout/FormLayout";
import { DataManager } from "../Data/DataManager";

interface Props {
	onStartBatch: () => void;
	onStartUnloading: () => void;
	onDevelopers: () => void;
	onCalibrate: () => void;
	dataManager: DataManager;
}

function MainForm({
	onStartBatch,
	onStartUnloading,
	onDevelopers,
	onCalibrate,
	dataManager,
}: Props) {
	const [, setUpdateTrigger] = useState(0);
	const currentBatch = dataManager.batch().getCurrentBatch();

	// Register with the batch handler to update when batch changes
	useEffect(() => {
		const handleUpdate = () => {
			setUpdateTrigger((prev) => prev + 1);
		};

		// Add the listener
		dataManager.batch().addListener(handleUpdate);

		// Clean up when the component unmounts
		return () => {
			dataManager.batch().removeListener(handleUpdate);
		};
	}, [dataManager]);

	const handleBatchButton = () => {
		onStartBatch();
	};

	return (
		<FormLayout title="Main Menu">
			<div className="button-container">
				<button
					className="standard-button"
					onClick={handleBatchButton}
					style={currentBatch ? { backgroundColor: "#dc3545" } : undefined}
				>
					{currentBatch ? "Cancel Batch" : "Start Batch"}
				</button>
				<button className="standard-button" onClick={onStartUnloading}>
					Start Unloading
				</button>
				<button className="standard-button" onClick={onCalibrate}>
					Calibrate Bin
				</button>
			</div>
			<InfoPreview dataManager={dataManager} />
			<div className="button-container">
				<button className="standard-button" onClick={onDevelopers}>
					Developers
				</button>
			</div>
		</FormLayout>
	);
}

export default MainForm;
