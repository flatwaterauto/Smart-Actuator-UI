import "./MainForm.css";
import "../components/Layout/Formatting.css";
import InfoPreview from "../components/ProjectSpecific/InfoPreview";
import FormLayout from "../components/Layout/FormLayout";
import { DataManager } from "../Data/DataManager";

interface Props {
	onStartBatch: () => void;
	onStartUnloading: () => void;
	onDevelopers: () => void;
	dataManager: DataManager;
}

function MainForm({
	onStartBatch,
	onStartUnloading,
	onDevelopers,
	dataManager,
}: Props) {
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
			<div className="button-container">
				<button className="standard-button" onClick={onDevelopers}>
					Developers
				</button>
			</div>
		</FormLayout>
	);
}

export default MainForm;
