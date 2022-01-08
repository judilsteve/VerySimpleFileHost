import { Checkbox, CheckboxProps } from "semantic-ui-react";

export interface SmallInlineCheckboxProps {
    onChange: (event: React.FormEvent<HTMLInputElement>, data: CheckboxProps) => void;
    checked: boolean;
}

function SmallCheckbox(props: SmallInlineCheckboxProps) {
    const {
        onChange,
        checked
    } = props;

    // TODO_JU Style this:
    // Inline
    // Same size as other icons in tree
    // Fades in/out on parent hover/unhover
    return <Checkbox onChange={onChange} checked={checked} />;
}

export default SmallCheckbox;
