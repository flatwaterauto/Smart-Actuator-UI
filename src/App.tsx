import { useMemo, useCallback } from "react";
import LoginForm from "./forms/LoginForm";
import MainForm from "./forms/MainForm";
import ErrorForm from "./forms/ErrorForm";
import StartBatchForm from "./forms/StartBatchForm";
import SettingsForm from "./forms/SettingsForm";
import UnloadingForm from "./forms/UnloadingForm";
import ConsoleForm from "./forms/ConsoleForm";
import DevelopersForm from "./forms/DevelopersForm";
import { DataManager } from "./Data/DataManager";
import { useEnumUrlParams } from "./helper/UrlParams";
import { BleManager } from "./connections/BleManager";
import { GlobalProvider } from "./contexts/GlobalContextProvider";
import { FormList } from "./Data/FormList";

const formToString: Record<FormList, string> = {
	[FormList.Login]: "login",
	[FormList.Main]: "main",
	[FormList.Error]: "error",
	[FormList.Start_Batch]: "start-batch",
	[FormList.Settings]: "settings",
	[FormList.Unloading]: "unloading",
	[FormList.Console]: "console",
	[FormList.Developers]: "developers",
};

const stringToForm: Record<string, FormList> = Object.entries(
	formToString
).reduce((acc, [key, value]) => ({ ...acc, [value]: Number(key) }), {});

function App() {
	const [currentForm, setCurrentForm] = useEnumUrlParams(
		"menu",
		FormList.Login,
		formToString,
		stringToForm
	);
	const dataManager = useMemo(() => new DataManager(), []);
	const bleManager = useMemo(() => new BleManager(dataManager), [dataManager]);

	const handleError = useCallback(
		(errorMessage: string) => {
			dataManager.error().setError(errorMessage, currentForm);
			setCurrentForm(FormList.Error);
		},
		[dataManager, setCurrentForm, currentForm]
	);

	const handleConnectionSuccess = () => {
		setCurrentForm(FormList.Main);
	};

	function renderContent() {
		console.log("Rendering form:", formToString[currentForm]);
		// Switch statement to render the correct form based on the currentForm state
		switch (currentForm) {
			case FormList.Login:
				return (
					<LoginForm
						error={dataManager.error().getError()?.message}
						onConnected={handleConnectionSuccess}
					/>
				);
			case FormList.Main:
				return (
					<MainForm
						onStartBatch={() => setCurrentForm(FormList.Start_Batch)}
						onStartUnloading={() => setCurrentForm(FormList.Unloading)}
						onDevelopers={() => setCurrentForm(FormList.Developers)}
						dataManager={dataManager}
					/>
				);
			case FormList.Error:
				return (
					<ErrorForm
						error={dataManager.error().getError()?.message ?? "Unknown error"}
						onTryAgain={() =>
							setCurrentForm(dataManager.error().getError().previousForm)
						}
					/>
				);
			case FormList.Start_Batch:
				return (
					<StartBatchForm
						onBack={() => setCurrentForm(FormList.Main)}
						dataManager={dataManager}
					/>
				);
			case FormList.Settings:
				return (
					<SettingsForm
						onBack={() => setCurrentForm(FormList.Developers)}
						dataManager={dataManager}
					/>
				);
			case FormList.Unloading:
				return <UnloadingForm onBack={() => setCurrentForm(FormList.Main)} />;
			case FormList.Console:
				return (
					<ConsoleForm
						onBack={() => setCurrentForm(FormList.Developers)}
						dataManager={dataManager}
					/>
				);
			case FormList.Developers:
				return (
					<DevelopersForm
						onBack={() => setCurrentForm(FormList.Main)}
						onSettings={() => setCurrentForm(FormList.Settings)}
						onConsole={() => setCurrentForm(FormList.Console)}
						dataManager={dataManager}
					/>
				);
		}
	}

	return (
		<GlobalProvider bleManager={bleManager} handleError={handleError}>
			{renderContent()}
		</GlobalProvider>
	);
}

export default App;
