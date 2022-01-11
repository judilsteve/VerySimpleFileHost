import { useCallback, useState } from "react";
import { useNavigate } from "react-router";
import { useSearchParams } from "react-router-dom";
import { Button, Form, Header, Input, Message } from "semantic-ui-react";
import { AuthenticationFailureDto, AuthenticationFailureReasonCode } from "../API";
import { routes } from "../App";
import RememberMe from "../Components/RememberMe";
import SkinnyForm from "../Components/SkinnyForm";
import useEndpointData from "../Hooks/useEndpointData";
import { usePageTitle } from "../Hooks/usePageTitle";
import { ChangePasswordRouteParameters } from "./ChangePassword";
import { loginApi as api } from "../apiInstances";
import { useSharedState } from "../Hooks/useSharedState";
import { passwordExpiredPromptState, rememberMeState, sessionExpiredPromptState } from "../State/sharedState";
import ThemeRule from "../Components/ThemeRule";
import { useIsMounted } from "../Hooks/useIsMounted";
import { printResponseError } from "../Utils/tryHandleError";

export enum LoginRouteParameters {
    then = 'then'
};

function Login() {
    usePageTitle('Log In');

    const [userName, setUserName] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, ] = useSharedState(rememberMeState);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const navigate = useNavigate();
    const then = useSearchParams()[0].get(LoginRouteParameters.then);
    const isMounted = useIsMounted();
    const login = async () => {
        if(loading) return;
        setLoading(true);
        setError('');
        try {
            await api.apiLoginLoginPost({ loginAttemptDto: {
                userName,
                password,
                rememberMe
            }});
        } catch(e) {
            const response = e as Response;
            if(response.status !== 401) {
                await printResponseError(e as Response, 'login');
                if(isMounted.current) setError('An unexpected error occurred');
            } else {
                const responseObject: AuthenticationFailureDto = await response.json();
                const reasonCode = responseObject.reasonCode;
                if(!isMounted.current) return;
                if(reasonCode === AuthenticationFailureReasonCode.PasswordExpired) {
                    passwordExpiredPromptState.setValue({
                        message: responseObject.reason!,
                        userName: userName
                    });
                    let destination = routes.changePassword;
                    if(then) destination += `?${ChangePasswordRouteParameters.then}=${encodeURIComponent(then)}`;
                    navigate(destination);
                }
                else setError(responseObject.reason ?? 'Unknown authentication error');
            }
            return;
        } finally {
            if(isMounted.current) {
                setLoading(false);
                setPassword('');
            }
        }
        sessionExpiredPromptState.setValue(false);
        if(isMounted.current) navigate(then ?? routes.browseFiles);
    };

    const [authConfig, ] = useEndpointData(
        useCallback(() => api.apiLoginAuthConfigGet(), []),
        useCallback(async e => {
            await printResponseError(e as Response, 'auth config');
            setError('An unexpected error occurred');
    }, []));

    const rememberMeProps = {
        allowRememberMe: authConfig?.allowRememberMe,
        tabIndex: 4,
        disabled: loading
    };

    const submitOnEnter = (e: KeyboardEvent) => {
        if(e.key === 'Enter' && userName && password) login();
    };

    return <SkinnyForm>
        <Header as="h1">VSFH<ThemeRule /></Header>
        <Form error={!!error}>
            <Form.Field>
                <Input disabled={loading} autoFocus tabIndex={1} icon="user" iconPosition="left" placeholder="Username" value={userName} onChange={e => setUserName(e.target.value)} />
            </Form.Field>
            <Form.Field>
                <Input
                    disabled={loading}
                    tabIndex={2}
                    icon="key"
                    iconPosition="left"
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    onKeyDown={submitOnEnter} />
            </Form.Field>
            <Message error header="Login Failed" content={error} />
            <Form.Field>
                <RememberMe {...rememberMeProps} />
                <Button tabIndex={3} primary type="button" floated="right" onClick={login} disabled={!userName || !password} loading={loading}>Log In</Button>
            </Form.Field>
        </Form>
    </SkinnyForm>;
}

export default Login;
