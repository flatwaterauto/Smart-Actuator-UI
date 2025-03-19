// import { createContext, useContext, ReactNode } from "react";
// import { BleManager } from "../connections/BleManager";

// interface BleContextType {
// 	bleManager: BleManager;
// 	handleError: (error: string) => void;
// }

// const BleContext = createContext<BleContextType | null>(null);

// export function useBle() {
// 	const context = useContext(BleContext);
// 	if (!context) {
// 		throw new Error("useBle must be used within a BleProvider");
// 	}
// 	return context;
// }

// interface BleProviderProps {
// 	bleManager: BleManager;
// 	handleError: (error: string) => void;
// 	children: ReactNode;
// }

// export function BleProvider({
// 	bleManager,
// 	handleError,
// 	children,
// }: BleProviderProps) {
// 	return (
// 		<BleContext.Provider value={{ bleManager, handleError }}>
// 			{children}
// 		</BleContext.Provider>
// 	);
// }
