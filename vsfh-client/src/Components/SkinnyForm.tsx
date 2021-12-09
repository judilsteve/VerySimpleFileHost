import React from "react";

export interface SkinnyFormProps {
    children: React.ReactNode;
}

function SkinnyForm(props: SkinnyFormProps) {
    const { children } = props;

    return <div style={{ maxWidth: 300, margin: "auto", marginTop: "10vh" }}>
        {children}
    </div>
}

export default SkinnyForm;