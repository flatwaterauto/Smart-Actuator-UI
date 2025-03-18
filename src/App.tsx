import { useMemo } from "react";
import LoginForm from "./forms/LoginForm";
import MainForm from "./forms/MainForm";
import ErrorForm from "./forms/ErrorForm";
import StartBatchForm from "./forms/StartBatchForm";
import SettingsForm from "./forms/SettingsForm";
import UnloadingForm from "./forms/UnloadingForm";
import { DataManager } from "./Data/DataManager";
import { useEnumUrlParams } from "./helper/UrlParams";

const enum FormList {
	Login,
	Main,
	Error,
	Start_Batch,
	Settings,
	Unloading,
}

const formToString: Record<FormList, string> = {
	[FormList.Login]: "login",
	[FormList.Main]: "main",
	[FormList.Error]: "error",
	[FormList.Start_Batch]: "start-batch",
	[FormList.Settings]: "settings",
	[FormList.Unloading]: "unloading",
};

const stringToForm: Record<string, FormList> = Object.entries(
	formToString
).reduce((acc, [key, value]) => ({ ...acc, [value]: Number(key) }), {});

function App() {
	const [currentForm, setCurrentForm] = useEnumUrlParams(
		"menu",
		FormList.Main,
		formToString,
		stringToForm
	);
	const dataManager = useMemo(() => new DataManager(), []);

	const handleConnectionSuccess = () => {
		setCurrentForm(FormList.Main);
	};

	// const handleError = (errorMessage: string) => {
	// 	dataManager.error().setError(errorMessage);
	// 	setCurrentForm(FormList.Error);
	// };

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
					onSettings={() => setCurrentForm(FormList.Settings)}
					onStartUnloading={() => setCurrentForm(FormList.Unloading)}
					dataManager={dataManager}
				/>
			);
		case FormList.Error:
			return (
				<ErrorForm
					error={dataManager.error().getError()?.message ?? "Unknown error"}
					onTryAgain={() => setCurrentForm(FormList.Login)}
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
					onBack={() => setCurrentForm(FormList.Main)}
					dataManager={dataManager}
				/>
			);
		case FormList.Unloading:
			return <UnloadingForm onBack={() => setCurrentForm(FormList.Main)} />;
	}
}

export default App;
