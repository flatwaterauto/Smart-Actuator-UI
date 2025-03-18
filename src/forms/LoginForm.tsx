import { useEffect } from "react";
import "./LoginForm.css";
import Spinner from "../components/ProjectSpecific/Spinner";
import ErrorConsole from "../components/ProjectSpecific/ErrorConsole";
import { isConnected } from "../connections/BleManager";
import FormLayout from "../components/Layout/FormLayout";

interface Props {
	error?: string;
	onConnected: () => void;
}

function LoginForm({ error, onConnected }: Props) {
	useEffect(() => {
		const checkConnection = async () => {
			const connected = await isConnected();
			if (connected) {
				onConnected();
			}
		};
		checkConnection();
	}, [onConnected]);

	return (
		<FormLayout title="Connecting to Brain">
			<div className="login-box">
				<Spinner />
				<ErrorConsole message={error} />
			</div>
		</FormLayout>
	);
}

export default LoginForm;
