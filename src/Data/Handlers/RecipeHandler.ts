import { Recipe } from "../Recipe";

export class RecipeHandler {
	private recipes: Recipe[] = [];
	private nextRecipeId = 1;

	constructor() {
		this.initializeDefaultRecipes();
	}

	private initializeDefaultRecipes(): void {
		this.addRecipe({
			name: "Layer",
			ingredients: [
				{ id: 1, quantity: 1200 }, // Wheat
			],
		});

		this.addRecipe({
			name: "Grower",
			ingredients: [
				{ id: 1, quantity: 50 }, // Wheat
				{ id: 2, quantity: 50 }, // Flax
				{ id: 5, quantity: 100 }, // Peas
			],
		});

		this.addRecipe({
			name: "Starter",
			ingredients: [
				{ id: 1, quantity: 25 }, // Wheat
				{ id: 2, quantity: 75 }, // Flax
				{ id: 5, quantity: 100 }, // Peas
			],
		});
	}

	public getRecipes(): Recipe[] {
		return [...this.recipes];
	}

	public getRecipe(id: number): Recipe | undefined {
		return this.recipes.find((recipe) => recipe.id === id);
	}

	public addRecipe(recipeData: Omit<Recipe, "id">): Recipe {
		const recipe: Recipe = {
			id: this.nextRecipeId++,
			...recipeData,
		};
		this.recipes.push(recipe);
		return recipe;
	}

	public updateRecipe(
		id: number,
		recipeData: Omit<Recipe, "id">
	): Recipe | undefined {
		const index = this.recipes.findIndex((r) => r.id === id);
		if (index === -1) return undefined;

		const updatedRecipe: Recipe = { id, ...recipeData };
		this.recipes[index] = updatedRecipe;
		return updatedRecipe;
	}

	public deleteRecipe(id: number): boolean {
		const index = this.recipes.findIndex((r) => r.id === id);
		if (index === -1) return false;

		this.recipes.splice(index, 1);
		return true;
	}
}
