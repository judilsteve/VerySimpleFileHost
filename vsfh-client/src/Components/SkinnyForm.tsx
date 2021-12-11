import React from "react";

export interface SkinnyFormProps {
    maxWidth?: number;
    children: React.ReactNode;
}

function SkinnyForm(props: SkinnyFormProps) {
    const { maxWidth, children } = props;

    return <div style={{ maxWidth: maxWidth ?? 300, margin: "auto", marginTop: "10vh" }}>
        {children}
    </div>
}

export default SkinnyForm;