import { RecipeSettings } from "../components/ProjectSpecific/RecipeSettings";
import { BinSettings } from "../components/ProjectSpecific/BinSettings";
import FormLayout from "../components/Layout/FormLayout";
import "./SettingsForm.css";
import { DataManager } from "../Data/DataManager";

interface SettingsFormProps {
	onBack: () => void;
	dataManager: DataManager;
}

function SettingsForm({ onBack, dataManager }: SettingsFormProps) {
	return (
		<FormLayout title="Settings" onBack={onBack}>
			<div className="settings-section">
				<h2>Recipe Configuration</h2>
				<RecipeSettings dataManager={dataManager} />
			</div>

			<div className="settings-section">
				<h2>Bin Configuration</h2>
				<BinSettings dataManager={dataManager} />
			</div>
		</FormLayout>
	);
}

export default SettingsForm;
