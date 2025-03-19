import { useState } from "react";
import { DataManager } from "../Data/DataManager";
import FormLayout from "../components/Layout/FormLayout";
import "./StartBatchForm.css";
import "../components/Layout/Formatting.css";
import { startBatch, stopBatch } from "../connections/BleEndpoints";
import { useGlobalContext } from "../contexts/GlobalContext";

interface StartBatchFormProps {
	onBack: () => void;
	dataManager: DataManager;
}

function StartBatchForm({ onBack, dataManager }: StartBatchFormProps) {
	const globalContext = useGlobalContext();
	const recipes = dataManager.recipe().getRecipes();
	const currentBatch = dataManager.batch().getCurrentBatch();
	const [recipe, setRecipe] = useState(1);
	const [quantity, setQuantity] = useState(4000);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		const selectedRecipe = dataManager.recipe().getRecipe(recipe);
		if (!selectedRecipe) {
			globalContext.handleError("No recipe selected");
			return;
		}

		const success = await startBatch(globalContext, selectedRecipe, quantity);
		if (success) {
			dataManager.batch().startBatch(recipe, quantity);
			onBack();
		} else {
			globalContext.handleError(
				"Failed to start batch - Check device connection"
			);
		}
	};

	const handleCancelBatch = async () => {
		const success = await stopBatch(globalContext);
		if (success) {
			dataManager.batch().endBatch();
			onBack();
		} else {
			globalContext.handleError(
				"Failed to stop batch - Check device connection"
			);
		}
	};

	if (currentBatch) {
		const batchRecipe = dataManager.recipe().getRecipe(currentBatch.recipeId);
		return (
			<FormLayout title="Current Batch" onBack={onBack}>
				<div className="form-content">
					<div className="form-group">
						<label>Current Recipe</label>
						<div>{batchRecipe?.name || "Unknown Recipe"}</div>
					</div>
					<div className="form-group">
						<label>Quantity</label>
						<div>{currentBatch.quantity} lbs</div>
					</div>
					<button
						className="standard-button"
						onClick={handleCancelBatch}
						style={{ backgroundColor: "#dc3545" }}
					>
						Cancel Batch
					</button>
				</div>
			</FormLayout>
		);
	}

	return (
		<FormLayout title="Start Batch" onBack={onBack}>
			<form onSubmit={handleSubmit} className="form-content">
				<div className="form-group">
					<label htmlFor="recipe">Recipe</label>
					<select
						id="recipe"
						value={recipe}
						onChange={(e) => {
							const newRecipeId = Number(e.target.value);
							console.log(newRecipeId);
							setRecipe(newRecipeId);
						}}
						required
					>
						<option value={-1}>Select a recipe</option>
						{recipes.map((recipe) => (
							<option key={recipe.id} value={recipe.id}>
								{recipe.name}
							</option>
						))}
					</select>
				</div>
				<div className="form-group">
					<label htmlFor="quantity">Quantity (lbs)</label>
					<input
						type="number"
						id="quantity"
						value={quantity}
						onChange={(e) => setQuantity(Number(e.target.value))}
						required
						min="0"
						max="10000"
						step="1"
					/>
				</div>
				<button type="submit" className="standard-button">
					Confirm
				</button>
			</form>
		</FormLayout>
	);
}

export default StartBatchForm;
