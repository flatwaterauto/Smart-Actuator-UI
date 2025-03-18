import "./InfoPreview.css";
import { DataManager } from "../../Data/DataManager";

interface InfoPreviewProps {
	dataManager: DataManager;
}

function InfoPreview({ dataManager }: InfoPreviewProps) {
	//get the current batch name
	const recipeID = dataManager.batch().getCurrentBatch()?.recipeId || -1;

	const recipeName = dataManager.recipe().getRecipe(recipeID)?.name || "None";

	const recipeQty = dataManager.batch().getCurrentBatch()?.quantity || -1;

	return (
		<div className="info-preview">
			<p>Current Recipe: {recipeName}</p>
			<p>Batch Size: {recipeQty} lbs</p>
			<p>Current Bin Type: Flax </p>
			<p>Last Ingredient Added: Wheat</p>
			<p>Current Weight: 1753 lbs</p>
		</div>
	);
}

export default InfoPreview;
