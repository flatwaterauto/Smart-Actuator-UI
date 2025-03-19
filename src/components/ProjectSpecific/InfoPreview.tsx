import "./InfoPreview.css";
import { DataManager } from "../../Data/DataManager";

interface InfoPreviewProps {
	dataManager: DataManager;
}

function InfoPreview({ dataManager }: InfoPreviewProps) {
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
