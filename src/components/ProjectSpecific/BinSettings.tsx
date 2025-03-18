import { useEffect, useState } from "react";
import { getBinSettings, saveBinSettings } from "../../connections/BleManager";
import "./BinSettings.css";
import Spinner from "./Spinner";

interface Bin {
	id: number;
	ingredient: string;
	resistorValue: number;
}

export function BinSettings() {
	const [bins, setBins] = useState<Bin[]>([]);
	const [isSaving, setIsSaving] = useState(false);
	const [expandedBins, setExpandedBins] = useState<Set<number>>(new Set());

	useEffect(() => {
		loadBinSettings();
	}, []);

	const loadBinSettings = async () => {
		const settings = await getBinSettings();
		setBins(settings);
	};

	const handleBinChange = (
		index: number,
		field: keyof Bin,
		value: string | number
	) => {
		const updatedBins = [...bins];
		updatedBins[index] = { ...updatedBins[index], [field]: value };
		setBins(updatedBins);
	};

	const handleSave = async () => {
		setIsSaving(true);
		try {
			await saveBinSettings(bins);
		} finally {
			setIsSaving(false);
		}
	};

	const toggleBin = (binId: number) => {
		setExpandedBins((prev) => {
			const next = new Set(prev);
			if (next.has(binId)) {
				next.delete(binId);
			} else {
				next.add(binId);
			}
			return next;
		});
	};

	return (
		<div className="bin-settings">
			{bins.map((bin, index) => (
				<div key={bin.id} className="bin-item">
					<div className="bin-header" onClick={() => toggleBin(bin.id)}>
						<span>
							Bin {bin.id} - {bin.ingredient || "Empty"}
						</span>
						<span
							className={`collapse-arrow ${
								expandedBins.has(bin.id) ? "expanded" : ""
							}`}
						>
							▼
						</span>
					</div>
					{expandedBins.has(bin.id) && (
						<div className="bin-content">
							<div>
								<label>Ingredient:</label>
								<input
									type="text"
									value={bin.ingredient}
									onChange={(e) =>
										handleBinChange(index, "ingredient", e.target.value)
									}
								/>
							</div>
							<div>
								<label>Resistor Value (Ω):</label>
								<input
									type="number"
									value={bin.resistorValue}
									onChange={(e) =>
										handleBinChange(
											index,
											"resistorValue",
											Number(e.target.value)
										)
									}
								/>
							</div>
						</div>
					)}
				</div>
			))}
			<button
				className="standard-button"
				onClick={handleSave}
				disabled={isSaving}
			>
				{isSaving ? "Saving..." : "Save Changes"}
				{isSaving && (
					<>
						<br />
						<br />
						<Spinner />
					</>
				)}
			</button>
		</div>
	);
}
