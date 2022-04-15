import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useSearchParams } from "react-router-dom";
import 'semantic-ui-less/definitions/elements/button.less';
import 'semantic-ui-less/definitions/collections/form.less';
import 'semantic-ui-less/definitions/elements/header.less';
import 'semantic-ui-less/definitions/elements/input.less';
import 'semantic-ui-less/definitions/collections/message.less';
import { Button, Form, Header, Input, Message } from "semantic-ui-react";
import { AuthenticationFailureDto, AuthStatusDto } from "../API";
import { routes } from "../App";
import RememberMe from "../Components/RememberMe";
import SetPassword from "../Components/SetPassword";
import SkinnyForm from "../Components/SkinnyForm";
import useEndpointData from "../Hooks/useEndpointData";
import { usePageTitle } from "../Hooks/usePageTitle";
import { loginApi as api, loginApi } from '../apiInstances';
import { useSharedState } from "../Hooks/useSharedState";
import { passwordExpiredPromptState, rememberMeState } from "../State/sharedState";
import ThemeRule from "../Components/ThemeRule";
import { useIsMounted } from "../Hooks/useIsMounted";
import { LoginRouteParameters } from "./Login";
import CenteredSpinner from "../Components/CenteredSpinner";
import { printResponseError } from "../Utils/tryHandleError";

export enum ChangePasswordRouteParameters {
    then = 'then'
};

function ChangePassword() {
    const [passwordExpiredPrompt, setPasswordExpiredPrompt] = useSharedState(passwordExpiredPromptState);

    const [userName, setUserName] = useState('');

    const navigate = useNavigate();
    useEffect(() => {
        if(passwordExpiredPrompt?.userName) {
            setUserName(passwordExpiredPrompt?.userName);
            return;
        }
        let cancel = false;
        (async () => {
            let authStatus: AuthStatusDto;
            try {
                authStatus = await loginApi.apiLoginAuthStatusGet();
            } catch(e) {
                const errorResponse = e as Response;
                if(errorResponse.status === 401) {
                    const location = window.location;
                    const then = `${location.pathname}${location.search}${location.hash}`;
                    if(cancel) return;
                    navigate(`${routes.login}?${LoginRouteParameters.then}=${encodeURIComponent(then)}`)
                } else {
                    await printResponseError(e as Response, 'auth status');
                    if(cancel) return;
                    setError('An unexpected error occurred');
                }
                return;
            }
            if(!cancel) setUserName(authStatus.userName!);
        })();
        return () => { cancel = true; };
    }, [passwordExpiredPrompt, navigate]);

    const message = passwordExpiredPrompt?.message ?? '';

    usePageTitle('Change Password');

    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [checkPassword, setCheckPassword] = useState('');
    const [passwordValid, setPasswordValid] = useState(false);
    const [error, setError] = useState('');
    const [authConfig, ] = useEndpointData(
        useCallback(() => api.apiLoginAuthConfigGet(), []),
        useCallback(async e => {
            await printResponseError(e as Response, 'auth config');
            setError('An unexpected error occurred');
    }, []));

    const [loading, setLoading] = useState(false);

    const [rememberMe, ] = useSharedState(rememberMeState);
    const rememberMeProps = {
        allowRememberMe: authConfig?.allowRememberMe,
        disabled: loading
    };

    const then = useSearchParams()[0].get(ChangePasswordRouteParameters.then);
    const isMounted = useIsMounted();
    const changePassword = async () => {
        if(loading) return;
        setLoading(true);
        try {
            const changePasswordAttemptDto = {
                userName,
                currentPassword,
                newPassword,
                rememberMe
            }
            await api.apiLoginChangePasswordPut({ changePasswordAttemptDto });
        } catch(e) {
            const response = e as Response;
            if(response.status !== 401) {
                await printResponseError(e as Response, 'change password');
                if(isMounted.current) setError('An unexpected error occurred');
            } else {
                const responseObject: AuthenticationFailureDto = await response.json();
                if(isMounted.current) setError(responseObject.reason ?? 'Unknown authentication error');
            }
            return;
        } finally {
            if(isMounted.current) {
                setLoading(false);
                setCurrentPassword('');
                setNewPassword('');
                setCheckPassword('');
            }
        }
        if(isMounted.current) {
            setPasswordExpiredPrompt(null);
            navigate(then ?? routes.browseFiles)
        };
    };

    const setPasswordProps = {
        password: newPassword,
        setPassword: setNewPassword,
        checkPassword,
        setCheckPassword,
        authConfig,
        passwordPlaceholder: 'New Password',
        setPasswordValid,
        currentPassword,
        disabled: loading,
        trySubmit: () => {
            if(passwordValid) changePassword();
        }
    };

    if(!userName) return <CenteredSpinner />;

    return <SkinnyForm width={350}>
        <Header as="h1" style={{ marginBottom: 0 }}>Change Password<ThemeRule /></Header>
        {
            message && <p><em>{message}</em></p>
        }
        <Form error={!!error}>
            <Form.Field>
                <Input icon="user" iconPosition="left" placeholder="Username"
                    value={userName} disabled={true} />
            </Form.Field>
            <Form.Field>
                <Input autoFocus disabled={loading}
                    icon="key" iconPosition="left"
                    placeholder="Current Password"
                    value={currentPassword} onChange={e => setCurrentPassword(e.target.value)}
                    type="password" />
            </Form.Field>
            <SetPassword {...setPasswordProps}/>
            <Message error header="Change Password Failed" content={error} />
            <Form.Field>
                <Button
                    primary type="button"
                    floated="right" onClick={changePassword}
                    disabled={!passwordValid} loading={loading}>
                    Change Password
                </Button>
                <RememberMe {...rememberMeProps} />
            </Form.Field>
        </Form>
    </SkinnyForm>
}

export default ChangePassword;
