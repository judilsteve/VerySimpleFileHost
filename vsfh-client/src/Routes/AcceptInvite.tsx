import { useCallback, useState } from "react";
import { Button, Form, Header, Input, Message } from "semantic-ui-react";
import { AuthenticationFailureDto } from "../API";
import RememberMe from "../Components/RememberMe";
import SkinnyForm from "../Components/SkinnyForm";
import { useNavigate } from "react-router";
import { inviteKeyParamName, routes } from "../App";
import useEndpointData from "../Hooks/useEndpointData";
import SetPassword from "../Components/SetPassword";
import { useParams } from "react-router";
import { usePageTitle } from "../Hooks/usePageTitle";
import { loginApi as api } from '../apiInstances';
import { useSharedState } from "../Hooks/useSharedState";
import { rememberMeState } from "../State/sharedState";
import ThemeRule from "../Components/ThemeRule";
import { useIsMounted } from "../Hooks/useIsMounted";
import { printResponseError } from "../Utils/tryHandleError";

function AcceptInvite() {
    usePageTitle('Accept Invite');

    const [userName, setUserName] = useState('');
    const [password, setPassword] = useState('');
    const [checkPassword, setCheckPassword] = useState('');
    const [rememberMe, ] = useSharedState(rememberMeState);
    const [passwordValid, setPasswordValid] = useState(false);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const inviteKey = useParams()[inviteKeyParamName];
    const navigate = useNavigate();
    const isMounted = useIsMounted();
    const activateAccount = async () => {
        if(loading) return;
        setLoading(true);
        setError('');
        try {
            await api.apiLoginAcceptInvitePost({ acceptInviteDto: {
                inviteKey,
                userName,
                newPassword: password,
                rememberMe
            }});
        } catch(e) {
            const response = e as Response;
            if(response.status === 401) {
                const responseObject: AuthenticationFailureDto = await response.json();
                if(isMounted.current) setError(responseObject.reason ?? 'Unknown authentication error');
            } else if(response.status === 400) {
                if(isMounted.current) setError(`A user with the name '${userName}' already exists`)
            } else {
                await printResponseError(e as Response, 'accept invite')
                if(isMounted.current) setError('An unexpected error occurred');
            }
            return;
        } finally {
            if(isMounted.current) {
                setLoading(false);
                setPassword('');
                setCheckPassword('');
            }
        }
        if(isMounted.current) navigate(routes.browseFiles);
    };

    const [authConfig, ] = useEndpointData(
        useCallback(() => api.apiLoginAuthConfigGet(), []),
        useCallback(async e => {
            await printResponseError(e as Response, 'auth config');
            setError('An unexpected error occurred');
        }, []));

    const canActivate = inviteKey
        && userName
        && authConfig
        && passwordValid;

    const rememberMeProps = {
        allowRememberMe: authConfig?.allowRememberMe,
        tabIndex: 5,
        disabled: loading
    };

    const setPasswordProps = {
        password, setPassword,
        checkPassword, setCheckPassword,
        authConfig,
        passwordPlaceholder: 'Password',
        setPasswordValid,
        startTabIndex: 2,
        disabled: loading,
        trySubmit: () => {
            if(canActivate) activateAccount();
        }
    };

    return <SkinnyForm width={350}>
        <Header as="h1" style={{ marginBottom: 0 }}>Welcome<ThemeRule /></Header>
        <p>Choose a username and password</p>
        <Form error={!!error}>
            <Form.Field>
                <Input autoFocus tabIndex={1}
                    icon="user" iconPosition="left"
                    placeholder="Username"
                    disabled={loading}
                    value={userName} onChange={e => setUserName(e.target.value)} />
            </Form.Field>
            <SetPassword {...setPasswordProps} />
            <Message error header="Activation Failed" content={error} />
            <Form.Field>
                <RememberMe {...rememberMeProps} />
                <Button tabIndex={4} primary type="button" floated="right" onClick={activateAccount} disabled={!canActivate} loading={loading}>Activate</Button>
            </Form.Field>
        </Form>
    </SkinnyForm>;
}

export default AcceptInvite;