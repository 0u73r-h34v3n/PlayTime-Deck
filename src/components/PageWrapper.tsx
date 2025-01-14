import type { CSSProperties } from "react";

interface PageWrapperProperties {
	children: JSX.Element;
	style?: CSSProperties;
}

export const PageWrapper: React.FC<PageWrapperProperties> = ({
	children,
	style,
}) => {
	return (
		<div
			style={{
				marginTop: "40px",
				height: "calc(100% - 40px)",
				background: "#0005",
				...style,
			}}
		>
			{children}
		</div>
	);
};
