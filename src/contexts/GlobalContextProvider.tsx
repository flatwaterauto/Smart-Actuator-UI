import { ReactNode } from "react";
import { BleManager } from "../connections/BleManager";
import { GlobalContext, GlobalContextType } from "./GlobalContext";

interface GlobalProviderProps {
	bleManager: BleManager;
	handleError: (error: string) => void;
	children: ReactNode;
}

export function GlobalProvider({
	bleManager,
	handleError,
	children,
}: GlobalProviderProps) {
	return (
		<GlobalContext.Provider value={{ bleManager, handleError }}>
			{children}
		</GlobalContext.Provider>
	);
}

export type { GlobalContextType };
// export { useGlobalContext } from "./GlobalContext";
