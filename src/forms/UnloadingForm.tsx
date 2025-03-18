import { useState } from "react";
import FormLayout from "../components/Layout/FormLayout";
import { startUnloading } from "../connections/BleManager";
import "./UnloadingForm.css";
import "../components/Layout/Formatting.css";
import Spinner from "../components/ProjectSpecific/Spinner";

interface UnloadingFormProps {
	onBack: () => void;
}

function UnloadingForm({ onBack }: UnloadingFormProps) {
	const [quantity, setQuantity] = useState(2000);
	const [isLoading, setIsLoading] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsLoading(true);
		try {
			const success = await startUnloading(quantity);
			if (success) {
				onBack();
			}
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<FormLayout title="Start Unloading" onBack={onBack}>
			<form onSubmit={handleSubmit}>
				<div>
					<label htmlFor="quantity">Quantity (lbs):</label>
					<input
						type="number"
						id="quantity"
						value={quantity}
						onChange={(e) => setQuantity(Number(e.target.value))}
						required
						disabled={isLoading}
					/>
				</div>
				<button type="submit" className="standard-button" disabled={isLoading}>
					{isLoading ? "Starting..." : "Start"}
				</button>
				{isLoading && <Spinner />}
			</form>
		</FormLayout>
	);
}

export default UnloadingForm;
