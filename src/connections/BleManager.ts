interface Bin {
	id: number;
	ingredient: string;
	resistorValue: number;
}

// Test data storage
let savedBins: Bin[] = [
	{ id: 1, ingredient: "Wheat", resistorValue: 100 },
	{ id: 2, ingredient: "Corn", resistorValue: 200 },
	{ id: 3, ingredient: "Soy", resistorValue: 300 },
	{ id: 4, ingredient: "Barley", resistorValue: 400 },
];

export function isConnected(): Promise<boolean> {
	console.log("Checking connection...");
	return new Promise((resolve) => {
		setTimeout(() => {
			resolve(true);
		}, 5000);
	});
}

export function getBinSettings(): Promise<Bin[]> {
	console.log("Loading bin settings...");
	return new Promise((resolve) => {
		setTimeout(() => {
			resolve([...savedBins]);
		}, 1000);
	});
}

export function saveBinSettings(bins: Bin[]): Promise<boolean> {
	console.log("Saving bin settings...");
	return new Promise((resolve) => {
		setTimeout(() => {
			savedBins = [...bins];
			resolve(true);
		}, 1000);
	});
}

export function startUnloading(quantity: number): Promise<boolean> {
	console.log("Starting unload of", quantity, "lbs");
	return new Promise((resolve) => {
		setTimeout(() => {
			resolve(true);
		}, 1000);
	});

	//TODO - add way to display error message
}
