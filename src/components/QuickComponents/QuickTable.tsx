import "./QuickTable.css";

interface Props {
	headers?: string[];
	data: string[][];
}

function QuickTable({ headers, data }: Props) {
	return (
		<>
			<table className="QuickTableBody">
				<thead>
					<tr>
						{headers &&
							headers.map((content, index) => (
								<th key={"TableHeader: " + index} className="QuickTableElement">
									{content}
								</th>
							))}
					</tr>
				</thead>
				<tbody>
					{data.map((rowdata, index) => (
						<tr className="QuickTableElement" key={"Tablerow: " + index}>
							{rowdata.map((content, index) => (
								<td
									className="QuickTableElement"
									key={"Tablecontent: " + index}
								>
									{content}
								</td>
							))}
						</tr>
					))}
				</tbody>
			</table>
		</>
	);
}

export default QuickTable;
