export type ValidIngredientName =
	| "Wheat"
	| "Flax"
	| "Oats"
	| "Barley"
	| "Peas"
	| "Molasses"
	| "Limestone"
	| "Fish Meal"
	| "Salt"
	| "Poultry VTM"
	| "Swine VTM"
	| "Alfalfa Pellets";

export interface Ingredient {
	id: IngredientId;
	quantity: number;
}

export interface Recipe {
	id: number;
	name: string;
	ingredients: Ingredient[];
}

// Add ingredient ID mapping
export const ingredientMapping = {
	1: "Wheat",
	2: "Flax",
	3: "Oats",
	4: "Barley",
	5: "Peas",
	6: "Molasses",
	7: "Limestone",
	8: "Fish Meal",
	9: "Salt",
	10: "Poultry VTM",
	11: "Swine VTM",
	12: "Alfalfa Pellets",
} as const;

export type IngredientId = keyof typeof ingredientMapping;

// Add helper functions
export function getIngredientName(id: IngredientId): ValidIngredientName {
	return ingredientMapping[id] as ValidIngredientName;
}

export function getAllIngredientIds(): IngredientId[] {
	return Object.keys(ingredientMapping).map(Number) as IngredientId[];
}
