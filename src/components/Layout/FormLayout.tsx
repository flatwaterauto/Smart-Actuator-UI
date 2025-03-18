import { ReactNode } from "react";
import "./FormLayout.css";

interface FormLayoutProps {
	title: string;
	onBack?: () => void;
	children: ReactNode;
}

function FormLayout({ title, onBack, children }: FormLayoutProps) {
	return (
		<div className="form-layout-container">
			{onBack && (
				<>
					<button className="form-layout-back-button" onClick={onBack}>
						Back
					</button>
				</>
			)}
			<div className="form-layout-content">
				<h1 className="form-layout-title">{title}</h1>
				{children}
			</div>
		</div>
	);
}

export default FormLayout;
