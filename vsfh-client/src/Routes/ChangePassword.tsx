import { h } from 'preact';
import { useCallback, useEffect, useState } from "preact/hooks";
import 'semantic-ui-less/definitions/elements/button.less';
import 'semantic-ui-less/definitions/collections/form.less';
import 'semantic-ui-less/definitions/elements/header.less';
import 'semantic-ui-less/definitions/elements/input.less';
import 'semantic-ui-less/definitions/collections/message.less';
import { Button, Header, Input, Message } from "semantic-ui-react";
import { AuthenticationFailureDto, AuthStatusDto } from "../API";
import { routes } from "../routes";
import RememberMe from "../Components/RememberMe";
import SetPassword from "../Components/SetPassword";
import SkinnyForm from "../Components/SkinnyForm";
import { Form, FormField } from "../Components/SemanticForm";
import useEndpointData from "../Hooks/useEndpointData";
import { loginApi as api, loginApi } from '../apiInstances';
import { useSharedState } from "../Hooks/useSharedState";
import { passwordExpiredPromptState, rememberMeState } from "../State/sharedState";
import ThemeRule from "../Components/ThemeRule";
import { useIsMounted } from "../Hooks/useIsMounted";
import { LoginRouteParameters } from "./Login";
import { printResponseError } from "../Utils/tryHandleError";
import { route } from "preact-router";
import { getSearchParam } from "../Utils/safeWindow";

export enum ChangePasswordRouteParameters {
    then = 'then'
};

function ChangePassword() {
    const [passwordExpiredPrompt, setPasswordExpiredPrompt] = useSharedState(passwordExpiredPromptState);

    const [userName, setUserName] = useState('');
    const [loadingUserName, setLoadingUserName] = useState(false);
    const [changingPassword, setChangingPassword] = useState(false);

    useEffect(() => {
        if(passwordExpiredPrompt?.userName) {
            setUserName(passwordExpiredPrompt?.userName);
            return;
        }
        setLoadingUserName(true);
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
                    route(`${routes.login.pathname}?${LoginRouteParameters.then}=${encodeURIComponent(then)}`)
                } else {
                    await printResponseError(e as Response, 'auth status');
                    if(cancel) return;
                    setError('An unexpected error occurred');
                }
                return;
            } finally {
                setLoadingUserName(false);
            }
            if(!cancel) setUserName(authStatus.userName!);
        })();
        return () => { cancel = true; };
    }, [passwordExpiredPrompt]);

    const message = passwordExpiredPrompt?.message ?? '';

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

    const [rememberMe, ] = useSharedState(rememberMeState);
    const rememberMeProps = {
        allowRememberMe: authConfig?.allowRememberMe,
        disabled: loadingUserName || changingPassword
    };

    const then = getSearchParam(ChangePasswordRouteParameters.then);
    const isMounted = useIsMounted();
    const changePassword = async () => {
        if(changingPassword) return;
        setChangingPassword(true);
        setError('');
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
                setChangingPassword(false);
                setCurrentPassword('');
                setNewPassword('');
                setCheckPassword('');
            }
        }
        if(isMounted.current) {
            setPasswordExpiredPrompt(null);
            route(then ?? routes.browseFiles.pathname)
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
        disabled: changingPassword || loadingUserName,
        trySubmit: () => {
            if(passwordValid) changePassword();
        }
    };

    return <SkinnyForm width={350}>
        <Header as="h1" style={{ marginBottom: 0 }}>Change Password<ThemeRule /></Header>
        {
            message && <p><em>{message}</em></p>
        }
        <Form error={!!error}>
            <FormField>
                <Input icon="user" iconPosition="left" placeholder="Username" onChange={e => setUserName(e.target.value)}
                    value={userName} disabled={changingPassword || loadingUserName} />
            </FormField>
            <FormField>
                <Input autoFocus disabled={changingPassword || loadingUserName}
                    icon="key" iconPosition="left"
                    placeholder="Current Password"
                    value={currentPassword} onChange={e => setCurrentPassword(e.target.value)}
                    type="password" />
            </FormField>
            <SetPassword {...setPasswordProps}/>
            <Message error header="Change Password Failed" content={error} />
            <FormField>
                <Button
                    primary type="button"
                    floated="right" onClick={changePassword}
                    disabled={!userName || !passwordValid} loading={changingPassword || loadingUserName}>
                    Change Password
                </Button>
                <RememberMe {...rememberMeProps} />
            </FormField>
        </Form>
    </SkinnyForm>
}

export default ChangePassword;
