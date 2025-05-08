import { Recipe } from "../Recipe";

export class RecipeHandler {
	private recipes: Recipe[] = [];
	private nextRecipeId = 1;
	private defaultVersion: number = 1;

	constructor() {
		this.initializeDefaultRecipes();
		this.loadRecipies();
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

	public loadRecipies(): void {
		// loads recipies from local storage.
		// if the default version is higher than the local storage version, overrite the local storage with the default recipes.

		const storedData = localStorage.getItem("recipes");
		const storedVersion = localStorage.getItem("recipesVersion");

		if (
			storedData &&
			storedVersion &&
			parseInt(storedVersion, 10) >= this.defaultVersion
		) {
			this.recipes = JSON.parse(storedData);
			this.nextRecipeId =
				this.recipes.length > 0
					? Math.max(...this.recipes.map((r) => r.id)) + 1
					: 1;
		} else {
			// Overwrite local storage with default recipes
			localStorage.setItem("recipes", JSON.stringify(this.recipes));
			localStorage.setItem("recipesVersion", this.defaultVersion.toString());
		}
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

		// Update localStorage
		this.saveRecipes();

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

		// Update localStorage
		this.saveRecipes();

		return updatedRecipe;
	}

	public deleteRecipe(id: number): boolean {
		const index = this.recipes.findIndex((r) => r.id === id);
		if (index === -1) return false;

		this.recipes.splice(index, 1);

		// Update localStorage
		this.saveRecipes();

		return true;
	}

	private saveRecipes(): void {
		localStorage.setItem("recipes", JSON.stringify(this.recipes));
		localStorage.setItem(
			"recipesVersion",
			(this.defaultVersion + 1).toString()
		);
	}
}
