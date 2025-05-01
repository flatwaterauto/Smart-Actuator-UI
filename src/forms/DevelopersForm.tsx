import FormLayout from "../components/Layout/FormLayout";
import "./DevelopersForm.css";
import "../components/Layout/Formatting.css";

interface DevelopersFormProps {
	onBack: () => void;
	onSettings: () => void;
	onConsole: () => void;
}

function DevelopersForm({
	onBack,
	onSettings,
	onConsole,
}: DevelopersFormProps) {
	return (
		<FormLayout title="Developer Menu" onBack={onBack}>
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
