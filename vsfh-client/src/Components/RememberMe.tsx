import { h, Fragment } from 'preact';

import { useEffect } from "preact/hooks";
import 'fomantic-ui-less/definitions/modules/checkbox.less';
import { Checkbox } from "semantic-ui-react";
import { useSharedState } from "../Hooks/useSharedState";
import { rememberMeState } from "../State/sharedState";

export interface RememberMeProps {
    allowRememberMe: boolean | undefined;
    disabled: boolean;
}

function RememberMe(props: RememberMeProps) {
    const { allowRememberMe, disabled } = props;

    const [rememberMe, setRememberMe] = useSharedState(rememberMeState);

    useEffect(() => {
        if(allowRememberMe === false) setRememberMe(false);
    }, [setRememberMe, allowRememberMe]);

    if(allowRememberMe)
        return <Checkbox aria-label="Remember me" checked={rememberMe} disabled={disabled} label="Remember me" onChange={_ => setRememberMe(!rememberMe)}/>;
    else return <></>;
}

export default RememberMe;