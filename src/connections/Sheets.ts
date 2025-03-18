import { Recipe } from "../Data/Recipe";

export type ImportedRecipe = Omit<Recipe, "id">;

export const importRecipe = async (): Promise<ImportedRecipe> => {
	// Simulating an API call delay
	await new Promise((resolve) => setTimeout(resolve, 1000));

	// Return dummy data
	return {
		name: "Imported Recipe",
		ingredients: [
			{ name: "Wheat", quanity: 50 },
			{ name: "Barley", quanity: 30 },
			{ name: "Peas", quanity: 20 },
		],
	};
};
