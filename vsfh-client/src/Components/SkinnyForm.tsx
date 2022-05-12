import { h } from 'preact';

export interface SkinnyFormProps {
    width?: number;
    children: preact.ComponentChildren;
}

function SkinnyForm(props: SkinnyFormProps) {
    const { width, children } = props;

    return <div style={{ width: width ?? 300, marginLeft: "auto", marginRight: "auto", paddingTop: "10vh" }}>
        {children}
    </div>
}

export default SkinnyForm;