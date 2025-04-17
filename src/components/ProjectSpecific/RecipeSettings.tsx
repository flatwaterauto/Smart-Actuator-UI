import { useState } from "react";
import {
	Recipe,
	Ingredient,
	getIngredientName,
	getAllIngredientIds,
} from "../../Data/Recipe";
import { importRecipe } from "../../connections/Sheets";
import "./RecipeSettings.css";
import { DataManager } from "../../Data/DataManager";

interface RecipeSettingsProps {
	dataManager: DataManager;
}

export function RecipeSettings({ dataManager }: RecipeSettingsProps) {
	const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
	const recipes = dataManager.recipe().getRecipes();

	const handleRecipeSelect = (id: number) => {
		const recipe = dataManager.recipe().getRecipe(id);
		if (recipe) {
			setEditingRecipe({ ...recipe });
		}
	};

	const handleNewRecipe = () => {
		const newRecipe = dataManager.recipe().addRecipe({
			name: "New Recipe",
			ingredients: [],
		});
		setEditingRecipe(newRecipe);
	};

	const handleSave = () => {
		if (!editingRecipe) return;

		if (editingRecipe.id) {
			dataManager.recipe().updateRecipe(editingRecipe.id, editingRecipe);
		}
		setEditingRecipe(null);
	};

	const handleDelete = () => {
		if (editingRecipe?.id) {
			dataManager.recipe().deleteRecipe(editingRecipe.id);
			setEditingRecipe(null);
		}
	};

	const handleImportRecipe = async () => {
		const importedRecipe = await importRecipe();
		const newRecipe = dataManager.recipe().addRecipe(importedRecipe);
		setEditingRecipe(newRecipe);
	};

	const handleAddIngredient = () => {
		if (!editingRecipe) return;
		setEditingRecipe({
			...editingRecipe,
			ingredients: [
				...editingRecipe.ingredients,
				{ id: 1, quantity: 0 }, // Default to Wheat (id: 1)
			],
		});
	};

	const handleUpdateIngredient = (
		index: number,
		field: keyof Ingredient,
		value: string | number
	) => {
		if (!editingRecipe) return;
		const newIngredients = [...editingRecipe.ingredients];
		newIngredients[index] = {
			...newIngredients[index],
			[field]: field === "quantity" ? Number(value) : Number(value),
		};
		setEditingRecipe({
			...editingRecipe,
			ingredients: newIngredients,
		});
	};

	const handleRemoveIngredient = (index: number) => {
		if (!editingRecipe) return;
		const newIngredients = editingRecipe.ingredients.filter(
			(_, i) => i !== index
		);
		setEditingRecipe({
			...editingRecipe,
			ingredients: newIngredients,
		});
	};

	return (
		<div className="recipe-controls">
			<button
				className="standard-button add-recipe-button"
				onClick={handleNewRecipe}
			>
				<span className="plus-icon">+</span>
				Add New Recipe
			</button>
			<button className="standard-button" onClick={handleImportRecipe}>
				Import Recipe
			</button>
			<select
				className="recipe-selector"
				value={editingRecipe?.id || ""}
				onChange={(e) => handleRecipeSelect(Number(e.target.value))}
			>
				<option value="">Select a recipe to edit...</option>
				{recipes.map((recipe) => (
					<option key={recipe.id} value={recipe.id}>
						{recipe.name}
					</option>
				))}
			</select>

			{editingRecipe && (
				<div className="recipe-form">
					<input
						type="text"
						value={editingRecipe.name}
						onChange={(e) =>
							setEditingRecipe({
								...editingRecipe,
								name: e.target.value,
							})
						}
						placeholder="Recipe Name"
					/>

					<div className="ingredients-list">
						<h3>Ingredients*</h3>
						{editingRecipe.ingredients.map((ingredient, index) => (
							<div key={index} className="ingredient-item">
								<select
									value={ingredient.id}
									onChange={(e) =>
										handleUpdateIngredient(index, "id", e.target.value)
									}
								>
									{getAllIngredientIds().map((id) => (
										<option key={id} value={id}>
											{getIngredientName(id)}
										</option>
									))}
								</select>
								<div className="ingredient-actions">
									<input
										type="number"
										value={ingredient.quantity}
										onChange={(e) =>
											handleUpdateIngredient(index, "quantity", e.target.value)
										}
										placeholder="Amount"
										min="0"
										step="1"
									/>
									<button
										className="remove-ingredient-button"
										onClick={() => handleRemoveIngredient(index)}
									>
										×
									</button>
								</div>
							</div>
						))}
						<button
							className="standard-button add-ingredient-button"
							onClick={handleAddIngredient}
						>
							Add Ingredient
						</button>
					</div>

					<button
						className="standard-button save-recipe-button"
						onClick={handleSave}
					>
						Save Changes
					</button>
					{editingRecipe.id && (
						<button
							className="standard-button delete-recipe-button"
							onClick={handleDelete}
						>
							Delete Recipe
						</button>
					)}
					<div className="recipe-footnote">
						* All recipes are based on 2000 lbs batch size
					</div>
				</div>
			)}
		</div>
	);
}
