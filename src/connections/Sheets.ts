import { Recipe } from "../Data/Recipe";

export type ImportedRecipe = Omit<Recipe, "id">;

export const importRecipe = async (): Promise<ImportedRecipe> => {
	// Simulating an API call delay
	await new Promise((resolve) => setTimeout(resolve, 1000));

	// Return dummy data
	return {
		name: "Imported Recipe",
		ingredients: [
			{ name: "Wheat", quantity: 50 },
			{ name: "Barley", quantity: 30 },
			{ name: "Peas", quantity: 20 },
		],
	};
};
