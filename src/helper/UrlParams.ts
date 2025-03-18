import { useEffect, useState } from "react";

type ValueType = string | number | boolean;

const useBaseUrlParams = <T extends ValueType>(
	paramName: string,
	defaultValue: T,
	fromString: (value: string | null) => T,
	toString: (value: T) => string
) => {
	const [value, setValue] = useState<T>(() => {
		const params = new URLSearchParams(window.location.search);
		return fromString(params.get(paramName));
	});

	useEffect(() => {
		const params = new URLSearchParams(window.location.search);
		if (!params.has(paramName)) {
			params.set(paramName, toString(defaultValue));
			window.history.replaceState(
				{},
				"",
				`${window.location.pathname}?${params}`
			);
		}
		// This comment is to tell eslint to ignore watching the toString function because it is a constant function
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [paramName, defaultValue]);

	const updateValue = (newValue: T) => {
		const params = new URLSearchParams(window.location.search);
		params.set(paramName, toString(newValue));
		window.history.replaceState(
			{},
			"",
			`${window.location.pathname}?${params}`
		);
		setValue(newValue);
	};

	return [value, updateValue] as const;
};

export const useStringUrlParams = (paramName: string, defaultValue: string) => {
	return useBaseUrlParams(
		paramName,
		defaultValue,
		(val) => val ?? defaultValue,
		String
	);
};

export const useNumberUrlParams = (paramName: string, defaultValue: number) => {
	return useBaseUrlParams(
		paramName,
		defaultValue,
		(val) => (val ? Number(val) : defaultValue),
		String
	);
};

export const useBooleanUrlParams = (
	paramName: string,
	defaultValue: boolean
) => {
	return useBaseUrlParams(
		paramName,
		defaultValue,
		(val) => (val ? val.toLowerCase() === "true" : defaultValue),
		String
	);
};

export const useEnumUrlParams = <T extends number>(
	paramName: string,
	defaultValue: T,
	enumMap: Record<T, string>,
	reverseEnumMap: Record<string, T>
) => {
	return useBaseUrlParams(
		paramName,
		defaultValue,
		(val) => (val ? reverseEnumMap[val] ?? defaultValue : defaultValue),
		(val) => enumMap[val]
	);
};
