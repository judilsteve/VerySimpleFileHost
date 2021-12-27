import { useEffect } from "react";
import { Checkbox } from "semantic-ui-react";
import { useSharedState } from "../Hooks/useSharedState";
import { rememberMeState } from "../State/sharedState";

export interface RememberMeProps {
    allowRememberMe: boolean | undefined;
    tabIndex?: number;
}

function RememberMe(props: RememberMeProps) {
    const { allowRememberMe, tabIndex } = props;

    const [rememberMe, setRememberMe] = useSharedState(rememberMeState);

    useEffect(() => {
        if(allowRememberMe === false) setRememberMe(false);
    }, [setRememberMe, allowRememberMe]);

    if(allowRememberMe)
        return <Checkbox checked={rememberMe} tabIndex={tabIndex} label="Remember me" onChange={() => setRememberMe(!rememberMe)}/>;
    else return <></>;
}

export default RememberMe;