import { h } from 'preact';
import { useCallback, useState } from "preact/hooks";
import 'fomantic-ui-less/definitions/elements/button.less';
import 'fomantic-ui-less/definitions/collections/form.less';
import 'fomantic-ui-less/definitions/elements/header.less';
import 'fomantic-ui-less/definitions/elements/input.less';
import 'fomantic-ui-less/definitions/collections/message.less';
import { Button, Header, Input, Message } from "semantic-ui-react";
import { AuthenticationFailureDto, AuthenticationFailureReasonCode } from "../API";
import { routes } from "../routes";
import RememberMe from "../Components/RememberMe";
import { Form, FormField } from '../Components/SemanticForm';
import SkinnyForm from "../Components/SkinnyForm";
import useEndpointData from "../Hooks/useEndpointData";
import { ChangePasswordRouteParameters } from "./ChangePassword";
import { loginApi as api } from "../apiInstances";
import { useSharedState } from "../Hooks/useSharedState";
import { passwordExpiredPromptState, rememberMeState, sessionExpiredPromptState } from "../State/sharedState";
import ThemeRule from "../Components/ThemeRule";
import { useIsMounted } from "../Hooks/useIsMounted";
import { printResponseError } from "../Utils/tryHandleError";
import { route } from "preact-router";
import { getSearchParam } from "../Utils/safeWindow";
import { usePageTitle } from '../Hooks/usePageTitle';
import sanitiseRedirectUrl from '../Utils/sanitiseRedirectUrl';

export enum LoginRouteParameters {
    then = 'then'
};

function Login() {
    usePageTitle(routes.login.title);

    const [userName, setUserName] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, ] = useSharedState(rememberMeState);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const then = sanitiseRedirectUrl(getSearchParam(LoginRouteParameters.then));
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
                    let destination = routes.changePassword.pathname;
                    if(then) destination += `?${ChangePasswordRouteParameters.then}=${encodeURIComponent(then)}`;
                    route(destination);
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
        if(isMounted.current) route(then ?? routes.browseFiles.pathname);
    };

    const [authConfig, ] = useEndpointData(
        useCallback(() => api.apiLoginAuthConfigGet(), []),
        useCallback(async e => {
            await printResponseError(e as Response, 'auth config');
            setError('An unexpected error occurred');
    }, []));

    const rememberMeProps = {
        allowRememberMe: authConfig?.allowRememberMe,
        disabled: loading
    };

    const submitOnEnter = (e: KeyboardEvent) => {
        if(e.key === 'Enter' && userName && password) login();
    };

    return <SkinnyForm>
        <Header as="h1">VSFH<ThemeRule /></Header>
        <Form error={!!error}>
            <FormField>
                <Input disabled={loading} autoFocus icon="user" iconPosition="left" placeholder="Username" value={userName} onChange={e => setUserName(e.target.value)} />
            </FormField>
            <FormField>
                <Input
                    disabled={loading}
                    icon="key"
                    iconPosition="left"
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    onKeyDown={submitOnEnter} />
            </FormField>
            <Message error header="Login Failed" content={error} />
            <FormField>
                <Button primary type="button" floated="right" onClick={login} disabled={!userName || !password} loading={loading}>Log In</Button>
                <RememberMe {...rememberMeProps} />
            </FormField>
        </Form>
    </SkinnyForm>;
}

export default Login;
