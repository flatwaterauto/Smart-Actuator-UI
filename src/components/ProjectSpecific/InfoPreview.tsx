import { useState, useEffect } from "react";
import "./InfoPreview.css";
import { DataManager } from "../../Data/DataManager";

interface InfoPreviewProps {
	dataManager: DataManager;
}

function InfoPreview({ dataManager }: InfoPreviewProps) {
	// Add state to force re-renders when data changes
	const [, setUpdateTrigger] = useState(0);

	// Subscribe to LiveDataHandler and BatchHandler changes
	useEffect(() => {
		const handleUpdate = () => {
			setUpdateTrigger((prev) => prev + 1);
		};

		// Add the listeners
		dataManager.liveData().addListener(handleUpdate);
		dataManager.batch().addListener(handleUpdate);

		// Clean up when the component unmounts
		return () => {
			dataManager.liveData().removeListener(handleUpdate);
			dataManager.batch().removeListener(handleUpdate);
		};
	}, [dataManager]);

	const recipeID = dataManager.batch().getCurrentBatch()?.recipeId || -1;
	const recipeName = dataManager.recipe().getRecipe(recipeID)?.name || "None";
	const recipeQty = dataManager.batch().getCurrentBatch()?.quantity || -1;

	const binType = dataManager.liveData().getCurrentBinType() || "None";
	const lastIngredient = dataManager.liveData().getLastIngredient() || "None";
	const currentWeight = dataManager.liveData().getCurrentWeight();

	return (
		<div className="info-preview">
			<p>Current Recipe: {recipeName}</p>
			<p>Batch Size: {recipeQty} lbs</p>
			<p>Current Bin Type: {binType}</p>
			<p>Last Ingredient Added: {lastIngredient}</p>
			<p>Current Weight: {currentWeight} lbs</p>
		</div>
	);
}

export default InfoPreview;
