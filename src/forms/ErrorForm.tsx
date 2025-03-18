import "./ErrorForm.css";
import "../components/Layout/Formatting.css";
import FormLayout from "../components/Layout/FormLayout";

interface ErrorFormProps {
	error: string;
	onTryAgain: () => void;
}

function ErrorForm({ error, onTryAgain }: ErrorFormProps) {
	return (
		<FormLayout title="Error">
			<div className="error-content">
				<p>{error}</p>
				<button onClick={onTryAgain} className="standard-button">
					Try Again
				</button>
			</div>
		</FormLayout>
	);
}

export default ErrorForm;
