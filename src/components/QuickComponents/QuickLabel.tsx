import { ReactNode, useId } from "react";
import * as CSS from "csstype";
import "./QuickLabel.css";

interface QuickLabelProps {
	component?: ReactNode;
	labelContent: ReactNode;
	leftlabel?: boolean;
	textAlignType?: CSS.Property.TextAlign;
	children?: ReactNode;
	handleOnClick?: (event: React.MouseEvent) => void;
}

function QuickLabel({
	component,
	labelContent,
	leftlabel = true,
	textAlignType,
	children,
	handleOnClick,
}: QuickLabelProps) {
	const id = useId();
	return (
		<>
			<div
				className="QuickLabelBody"
				style={{
					textAlign:
						textAlignType !== undefined
							? textAlignType
							: leftlabel
							? "right"
							: "left",
				}}
				onClick={handleOnClick}
			>
				{leftlabel && (
					<label htmlFor={id} style={{ paddingRight: "5px" }}>
						{labelContent}
					</label>
				)}
				<span id={id}>
					{component}
					{children}
				</span>
				{!leftlabel && (
					<label htmlFor={id} style={{ paddingLeft: "5px" }}>
						{labelContent}
					</label>
				)}
			</div>
		</>
	);
}

export default QuickLabel;
