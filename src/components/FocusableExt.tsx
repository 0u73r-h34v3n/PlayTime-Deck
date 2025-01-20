import { Focusable } from "@decky/ui";
import { focus_panel_no_padding } from "../styles";

interface FocusableExtProperties {
	children: JSX.Element | Array<JSX.Element>;
	focusWithinClassName?: string;
	onActivate?: () => void;
	onOptionsActionDescription?: JSX.Element;
	onOptionsButton?: () => void;
}

export const FocusableExt: React.FC<FocusableExtProperties> = ({
	children,
	focusWithinClassName,
	onActivate = () => {},
	onOptionsActionDescription,
	onOptionsButton,
}) => {
	return (
		<Focusable
			focusWithinClassName={focusWithinClassName}
			onActivate={onActivate}
			onOptionsActionDescription={onOptionsActionDescription}
			onOptionsButton={onOptionsButton}
			style={focus_panel_no_padding}
		>
			{children}
		</Focusable>
	);
};
