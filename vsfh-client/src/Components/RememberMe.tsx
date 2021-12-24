import { useEffect } from "react";
import { Checkbox } from "semantic-ui-react";

export interface RememberMeProps {
    setRememberMe: (setter: (boolean | ((oldValue: boolean) => boolean))) => void;
    allowRememberMe: boolean;
    tabIndex?: number;
}

function RememberMe(props: RememberMeProps) {
    const { setRememberMe, allowRememberMe, tabIndex } = props;

    useEffect(() => {
        if(!allowRememberMe) setRememberMe(false);
    }, [setRememberMe, allowRememberMe]);

    if(allowRememberMe)
        return <Checkbox tabIndex={tabIndex} label="Remember me" onChange={() => setRememberMe(rm => !rm)}/>;
    else return <></>;
}

export default RememberMe;