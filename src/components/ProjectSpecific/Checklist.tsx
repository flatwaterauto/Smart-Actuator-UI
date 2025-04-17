import { useState, useEffect, useRef } from "react";
import "./Checklist.css";

interface ChecklistInterval {
	startDate: string; // ISO date string
	intervalDays: number; // Number of days between resets
}

interface ChecklistItem {
	id: string;
	text: string;
	completed: boolean;
	intervals: ChecklistInterval[];
	lastCompleted?: string; // ISO date string of last completion
}

interface ChecklistStorage {
	version: number;
	items: ChecklistItem[];
}

interface ChecklistProps {
	storageKey: string;
	readOnly?: boolean;
	defaultData?: string; // JSON string of ChecklistStorage
}

// Add type definition to window object
declare global {
	interface Window {
		checklist?: {
			exportSettings: () => string;
			importSettings: (jsonString: string) => void;
		};
	}
}

function Checklist({
	storageKey,
	readOnly = false,
	defaultData,
}: ChecklistProps) {
	// Debug configuration
	const DEBUG_ENABLED = true;
	// Change this date for testing different scenarios - includes timezone offset
	const DEBUG_CURRENT_DATE = "2025-03-28T01:00:00-07:00"; // YYYY-MM-DDTHH:mm:ssZ format
	// const DEBUG_CURRENT_DATE = "2025-03-28"; // YYYY-MM-DD format

	const getCurrentDate = (): Date => {
		// Ensure debug date is properly normalized with timezone
		if (DEBUG_ENABLED) {
			const debugDate = new Date(DEBUG_CURRENT_DATE);
			return normalizeDate(debugDate);
		}
		return normalizeDate(new Date());
	};

	const debug = (message: string, ...args: any[]) => {
		if (DEBUG_ENABLED) {
			console.log(`[Checklist] ${message}`, ...args);
		}
	};

	// Date utility functions
	const normalizeDate = (date: Date): Date => {
		return new Date(date.getFullYear(), date.getMonth(), date.getDate());
	};

	const calculateNextReset = (item: ChecklistItem): Date => {
		if (!item.intervals.length) return normalizeDate(new Date());

		const now = normalizeDate(getCurrentDate());
		let nextReset = new Date(8640000000000000); // Far future date

		item.intervals.forEach((interval) => {
			const startDate = normalizeDate(new Date(interval.startDate));
			const lastCompletedDate = item.lastCompleted
				? normalizeDate(new Date(item.lastCompleted))
				: startDate;

			// Calculate days since start
			const daysSinceStart = Math.ceil(
				(lastCompletedDate.getTime() - startDate.getTime()) /
					(24 * 60 * 60 * 1000)
			);

			// Find next interval
			let nextIntervalNumber = Math.ceil(
				daysSinceStart / interval.intervalDays
			);
			let currentReset = normalizeDate(new Date(startDate));
			currentReset.setDate(
				startDate.getDate() + 1 + nextIntervalNumber * interval.intervalDays
			);

			// Compare normalized dates for same-day check
			const normalizedCurrentReset = normalizeDate(currentReset);
			const normalizedLastCompleted = normalizeDate(lastCompletedDate);

			if (
				normalizedCurrentReset.getTime() === normalizedLastCompleted.getTime()
			) {
				nextIntervalNumber++;
				currentReset = normalizeDate(new Date(startDate));
				currentReset.setDate(
					startDate.getDate() + nextIntervalNumber * interval.intervalDays
				);
			}

			// Keep the earliest next reset date
			if (currentReset < nextReset) {
				nextReset = currentReset;
			}
		});

		return nextReset;
	};

	// Change state type and initialization
	const [storage, setStorage] = useState<ChecklistStorage>(() => {
		try {
			debug("Initializing checklist");
			let shouldUseDefault = false;

			// Parse default data if provided
			let defaultStorage: ChecklistStorage | null = null;
			if (defaultData) {
				try {
					defaultStorage = JSON.parse(defaultData);
					if (!Array.isArray(defaultStorage?.items)) {
						debug("Invalid default data format");
						defaultStorage = null;
					}
				} catch (e) {
					debug("Error parsing default data:", e);
				}
			}

			if (storageKey) {
				const savedData = localStorage.getItem(storageKey);
				if (savedData) {
					try {
						const savedStorage: ChecklistStorage = JSON.parse(savedData);
						if (Array.isArray(savedStorage?.items)) {
							if (
								defaultStorage &&
								defaultStorage.version > (savedStorage.version || 0)
							) {
								debug("Default data version is newer, using default data");
								shouldUseDefault = true;
							} else {
								debug("Using saved data:", savedStorage);
								return savedStorage;
							}
						}
					} catch (e) {
						debug("Error parsing saved data:", e);
						shouldUseDefault = true;
					}
				} else {
					shouldUseDefault = true;
				}
			}

			if (shouldUseDefault && defaultStorage) {
				debug("Using default data:", defaultStorage);
				if (storageKey) {
					localStorage.setItem(
						storageKey,
						defaultData || '{"version":1,"items":[]}'
					);
				}
				return defaultStorage;
			}

			return { version: 1, items: [] };
		} catch (error) {
			console.error("[Checklist] Error during initialization:", error);
			return { version: 1, items: [] };
		}
	});

	// Add ref for external access
	const setStorageRef = useRef(setStorage);
	setStorageRef.current = setStorage;

	// Helper function to update items
	const setItems = (
		newItems: ChecklistItem[] | ((prev: ChecklistItem[]) => ChecklistItem[])
	) => {
		setStorage((prev) => ({
			...prev,
			items: typeof newItems === "function" ? newItems(prev.items) : newItems,
		}));
	};

	const [newItemText, setNewItemText] = useState("");
	const [formIntervals, setFormIntervals] = useState<ChecklistInterval[]>([
		{
			startDate: getCurrentDate().toISOString().split("T")[0],
			intervalDays: 7,
		},
	]);

	const addInterval = () => {
		setFormIntervals([
			...formIntervals,
			{
				startDate: getCurrentDate().toISOString().split("T")[0],
				intervalDays: 7,
			},
		]);
	};

	const removeInterval = (index: number) => {
		setFormIntervals(formIntervals.filter((_, i) => i !== index));
	};

	const updateInterval = (
		index: number,
		field: keyof ChecklistInterval,
		value: string | number
	) => {
		setFormIntervals(
			formIntervals.map((interval, i) =>
				i === index ? { ...interval, [field]: value } : interval
			)
		);
	};

	const addItem = (e: React.FormEvent) => {
		e.preventDefault();
		if (!newItemText.trim() || formIntervals.length === 0) {
			debug("Attempted to add invalid item, ignoring");
			return;
		}

		debug("Adding new item:", newItemText);
		const newItem: ChecklistItem = {
			id: Date.now().toString(),
			text: newItemText.trim(),
			completed: false,
			intervals: [...formIntervals],
		};

		setItems((prevItems) => [...prevItems, newItem]);
		setNewItemText("");
		setFormIntervals([
			{
				startDate: getCurrentDate().toISOString().split("T")[0],
				intervalDays: 7,
			},
		]);
	};

	// Debug component mount
	useEffect(() => {
		debug("Component mounted with items:", storage.items);
		return () => {
			debug("Component unmounting with items:", storage.items);
		};
	}, [storage.items]);

	// Update localStorage effect
	useEffect(() => {
		if (!storageKey) return;

		if (storage.items.length === 0 && !localStorage.getItem(storageKey)) {
			debug("Skipping initial empty save");
			return;
		}

		try {
			localStorage.setItem(storageKey, JSON.stringify(storage));
			debug("Saved storage with version: " + String(storage.version));
		} catch (error) {
			console.error("[Checklist] Error saving storage:", error);
		}
	}, [storage, storageKey]);

	// Check for expired items every minute
	useEffect(() => {
		const checkExpiredItems = () => {
			setItems((prevItems) =>
				prevItems.map((item) => {
					if (!item.completed) return item;
					const nextReset = calculateNextReset(item);
					const now = normalizeDate(getCurrentDate());

					if (now >= nextReset) {
						debug(`Item expired: ${item.text}, next reset: ${nextReset}`);
						return { ...item, completed: false };
					}
					return item;
				})
			);
		};

		const interval = setInterval(checkExpiredItems, 60000); // Check every minute
		checkExpiredItems(); // Initial check

		return () => clearInterval(interval);
	}, []);

	// Update export/import functions
	useEffect(() => {
		window.checklist = {
			exportSettings: () => JSON.stringify(storage),
			importSettings: (jsonString: string) => {
				if (readOnly) {
					console.error("[Checklist] Cannot import settings in read-only mode");
					return;
				}
				try {
					const storage: ChecklistStorage = JSON.parse(jsonString);
					// Validate storage structure
					if (!storage || typeof storage !== "object") {
						throw new Error("Invalid storage format");
					}
					if (!Array.isArray(storage.items)) {
						throw new Error("Storage items must be an array");
					}
					if (typeof storage.version !== "number") {
						throw new Error("Storage must include version number");
					}

					// Validate each item in the array
					storage.items.forEach((item, index) => {
						if (!item || typeof item !== "object") {
							throw new Error(`Invalid item at index ${index}`);
						}
						if (
							!item.id ||
							!item.text ||
							typeof item.completed !== "boolean" ||
							!item.intervals ||
							!Array.isArray(item.intervals)
						) {
							throw new Error(
								`Missing required properties in item at index ${index}`
							);
						}
					});

					setStorageRef.current(storage);
					debug("Successfully imported settings:", storage);
				} catch (error) {
					console.error("[Checklist] Import failed:", error);
					setStorageRef.current({ version: 1, items: [] }); // Reset to empty array on error
				}
			},
		};

		return () => {
			delete window.checklist;
		};
	}, [storage, readOnly]);

	const toggleItem = (id: string) => {
		debug("Toggling item with id:", id);
		setItems((prevItems) => {
			const newItems = prevItems.map((item) =>
				item.id === id
					? {
							...item,
							completed: !item.completed,
							lastCompleted: !item.completed
								? getCurrentDate().toISOString()
								: item.lastCompleted,
					  }
					: item
			);
			debug("Updated items after toggle:", newItems);
			return newItems;
		});
	};

	const removeItem = (id: string) => {
		debug("Removing item with id:", id);
		setItems((prevItems) => {
			const newItems = prevItems.filter((item) => item.id !== id);
			debug("Remaining items after removal:", newItems);
			return newItems;
		});
	};

	const getNextResetDate = (item: ChecklistItem): string => {
		if (!item.completed) return "Not completed";
		return calculateNextReset(item).toLocaleDateString();
	};

	return (
		<div className="checklist-container">
			<ul className="checklist-items">
				{Array.isArray(storage.items) &&
					storage.items.map((item) => (
						<li key={item.id} className="checklist-item">
							<label className="checklist-label">
								<input
									type="checkbox"
									checked={item.completed}
									onChange={() => toggleItem(item.id)}
									className="checklist-checkbox"
								/>

								<span
									className={`checklist-text ${
										item.completed ? "completed" : ""
									}`}
								>
									<span>{item.text}</span>
									<span className="checklist-reset-date">
										Next reset: {getNextResetDate(item)}
									</span>
								</span>
							</label>
							{!readOnly && (
								<button
									onClick={() => removeItem(item.id)}
									className="checklist-remove-button"
									aria-label="Remove item"
								>
									×
								</button>
							)}
						</li>
					))}
			</ul>

			{!readOnly && (
				<form onSubmit={addItem} className="checklist-form">
					<input
						type="text"
						value={newItemText}
						onChange={(e) => setNewItemText(e.target.value)}
						placeholder="Add new item..."
						className="checklist-input"
					/>
					<div className="intervals-container">
						{formIntervals.map((interval, index) => (
							<div key={index} className="interval-row">
								<input
									type="date"
									value={interval.startDate}
									onChange={(e) =>
										updateInterval(index, "startDate", e.target.value)
									}
									className="checklist-date-input"
								/>
								<div className="checklist-interval-container">
									<input
										type="number"
										value={interval.intervalDays}
										onChange={(e) =>
											updateInterval(
												index,
												"intervalDays",
												Number(e.target.value)
											)
										}
										min="1"
										placeholder="Days"
										className="checklist-interval-input"
									/>
									<span className="checklist-interval-label">days</span>
								</div>
								{formIntervals.length > 1 && (
									<button
										type="button"
										onClick={() => removeInterval(index)}
										className="checklist-remove-button"
									>
										×
									</button>
								)}
							</div>
						))}
						<button
							type="button"
							onClick={addInterval}
							className="checklist-add-interval-button"
						>
							+ Add Interval
						</button>
					</div>
					<button type="submit" className="checklist-add-button">
						Add
					</button>
				</form>
			)}
		</div>
	);
}

export default Checklist;
