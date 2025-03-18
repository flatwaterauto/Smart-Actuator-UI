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
	name: ValidIngredientName;
	quanity: number;
}

export interface Recipe {
	id: number;
	name: string;
	ingredients: Ingredient[];
}
