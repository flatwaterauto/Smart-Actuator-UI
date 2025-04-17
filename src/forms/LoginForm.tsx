import { useState } from "react";
import "./LoginForm.css";
import Spinner from "../components/ProjectSpecific/Spinner";
import ErrorConsole from "../components/ProjectSpecific/ErrorConsole";
import { isConnected } from "../connections/BleEndpoints";
import FormLayout from "../components/Layout/FormLayout";
import { useGlobalContext } from "../contexts/GlobalContext";
import Checklist from "../components/ProjectSpecific/Checklist";

interface Props {
	error?: string;
	onConnected: () => void;
}

function LoginForm({ error, onConnected }: Props) {
	const globalContext = useGlobalContext();
	const [isConnecting, setIsConnecting] = useState(false);

	const handleConnect = async () => {
		setIsConnecting(true);
		try {
			const connected = await isConnected(globalContext);
			if (connected) {
				onConnected();
			}
		} finally {
			setIsConnecting(false);
		}
	};

	return (
		<>
			<FormLayout title="Connect to Brain">
				<div className="login-box">
					{isConnecting ? (
						<>
							<Spinner />
							<ErrorConsole message="Connecting..." />
						</>
					) : (
						<>
							<center>
								<button className="standard-button" onClick={handleConnect}>
									Connect to Device
								</button>
							</center>
							<ErrorConsole message={error} />
						</>
					)}
				</div>
			</FormLayout>
		</>
	);
}

export default LoginForm;
