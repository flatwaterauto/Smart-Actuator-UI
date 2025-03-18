import "./QuickSelect.css";

//controlled select objects use the value tag
//non controlled objects use the defaul value tag
interface QuickSelectProps {
	items: string[];
	controlled?: boolean;
	selected: number;
	handleOnChange?: (event: React.ChangeEvent) => void;
}

function QuickSelect({
	items,
	controlled = false,
	selected,
	handleOnChange,
}: QuickSelectProps) {
	return (
		<>
			<select
				{...(controlled && { value: items[selected] })}
				{...(!controlled && { defaultValue: items[selected || 0] })}
				className="QuickSelectBody"
				onChange={handleOnChange}
			>
				{items.map((item, index) => (
					<option value={item} key={"item: " + index}>
						{item}
					</option>
				))}
			</select>
		</>
	);
}

export default QuickSelect;
