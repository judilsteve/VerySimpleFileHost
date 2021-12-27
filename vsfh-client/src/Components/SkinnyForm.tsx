import React from "react";

export interface SkinnyFormProps {
    width?: number;
    children: React.ReactNode;
}

function SkinnyForm(props: SkinnyFormProps) {
    const { width, children } = props;

    return <div style={{ width: width ?? 300, marginLeft: "auto", marginRight: "auto", paddingTop: "10vh" }}>
        {children}
    </div>
}

export default SkinnyForm;