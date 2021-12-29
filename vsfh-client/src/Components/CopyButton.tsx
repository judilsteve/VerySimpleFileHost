import { cloneElement, ReactElement, useEffect, useState } from "react";
import { Popup } from "semantic-ui-react";

export interface CopyButtonProps {
    getTextToCopy: () => string;
    button: ReactElement;
}

function CopyButton(props: CopyButtonProps) {
    const { getTextToCopy, button } = props;

    const [justCopied, setJustCopied] = useState(false);
    const copyHash = () => {
        navigator.clipboard.writeText(getTextToCopy());
        setJustCopied(true);
    };

    useEffect(() => {
        if(!justCopied) return;
        const timer = window.setTimeout(() => setJustCopied(false), 1000);
        return () => window.clearTimeout(timer);
    }, [justCopied]);

    return <Popup
        open={justCopied}
        content="Copied to clipboard"
        trigger={cloneElement(button, { onClick: copyHash })} />
}

export default CopyButton;
