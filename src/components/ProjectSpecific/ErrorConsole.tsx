import "./ErrorConsole.css";

interface ErrorConsoleProps {
	message?: string;
	defaultMessage?: string;
}

function ErrorConsole({
	message,
	defaultMessage = "Awaiting connection...",
}: ErrorConsoleProps) {
	return <div className="console">{message || defaultMessage}</div>;
}

export default ErrorConsole;
