import "./MainForm.css";
import "../components/Layout/Formatting.css";
import InfoPreview from "../components/ProjectSpecific/InfoPreview";
import FormLayout from "../components/Layout/FormLayout";
import { DataManager } from "../Data/DataManager";

interface Props {
	onStartBatch: () => void;
	onSettings: () => void;
	onStartUnloading: () => void;
	dataManager: DataManager;
}

function MainForm({ onStartBatch, onStartUnloading, dataManager }: Props) {
	const currentBatch = dataManager.batch().getCurrentBatch();

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
			</div>
			<InfoPreview dataManager={dataManager} />
		</FormLayout>
	);
}

export default MainForm;
