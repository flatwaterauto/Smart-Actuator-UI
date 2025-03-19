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
				{ name: "Wheat", quantity: 75 },
				{ name: "Flax", quantity: 25 },
				{ name: "Peas", quantity: 100 },
			],
		});

		this.addRecipe({
			name: "Grower",
			ingredients: [
				{ name: "Wheat", quantity: 50 },
				{ name: "Flax", quantity: 50 },
				{ name: "Peas", quantity: 100 },
			],
		});

		this.addRecipe({
			name: "Starter",
			ingredients: [
				{ name: "Wheat", quantity: 25 },
				{ name: "Flax", quantity: 75 },
				{ name: "Peas", quantity: 100 },
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
