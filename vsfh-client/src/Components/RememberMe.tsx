import { useEffect, useState } from "react";
import { Checkbox } from "semantic-ui-react";
import { Configuration, LoginApi } from "../API";

export interface RememberMeProps {
    setRememberMe: (setter: (boolean | ((oldValue: boolean) => boolean))) => void;
}

const api = new LoginApi(new Configuration({ basePath: window.location.origin })); // TODO_JU Shared instances for these?

function RememberMe(props: RememberMeProps) {
    const { setRememberMe } = props;

    const [allowRememberMe, setAllowRememberMe] = useState(false);
    useEffect(() => {
        let cancel = false;
        (async () => {
            const authConfig = await api.loginAuthConfigGet();
            if(cancel) return;
            setAllowRememberMe(authConfig.allowRememberMe!);
            if(!authConfig.allowRememberMe) setRememberMe(false);
        })();
        return () => { cancel = true; }
    }, [setRememberMe]);

    if(allowRememberMe)
        return <Checkbox tabIndex={4} label="Remember me" onChange={e => setRememberMe(rm => !rm)}/>;
    else return <></>;
}

export default RememberMe;