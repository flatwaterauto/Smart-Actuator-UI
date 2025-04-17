import { Recipe } from "../Data/Recipe";

export type ImportedRecipe = Omit<Recipe, "id">;

export const importRecipe = async (): Promise<ImportedRecipe> => {
	// Simulating an API call delay
	await new Promise((resolve) => setTimeout(resolve, 1000));

	// Return dummy data
	return {
		name: "Imported Recipe",
		ingredients: [
			{ id: 1, quantity: 50 }, // Wheat has ID 1
			{ id: 4, quantity: 30 }, // Barley has ID 4
			{ id: 5, quantity: 20 }, // Peas has ID 5
		],
	};
};
