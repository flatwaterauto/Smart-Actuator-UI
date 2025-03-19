import { createContext, useContext } from "react";
import { BleManager } from "../connections/BleManager";

export interface GlobalContextType {
	bleManager: BleManager;
	handleError: (error: string) => void;
}

export const GlobalContext = createContext<GlobalContextType | null>(null);

export function useGlobalContext() {
	const context = useContext(GlobalContext);
	if (!context) {
		throw new Error("useGlobalContext must be used within a GlobalProvider");
	}
	return context;
}
