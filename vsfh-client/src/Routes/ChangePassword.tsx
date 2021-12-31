import { useCallback, useState } from "react";
import { useNavigate } from "react-router";
import { useSearchParams } from "react-router-dom";
import { Button, Form, Header, Input, Message } from "semantic-ui-react";
import { AuthenticationFailureDto } from "../API";
import { routes } from "../App";
import RememberMe from "../Components/RememberMe";
import SetPassword from "../Components/SetPassword";
import SkinnyForm from "../Components/SkinnyForm";
import useEndpointData from "../Hooks/useEndpointData";
import { usePageTitle } from "../Hooks/usePageTitle";
import { loginApi as api } from '../apiInstances';
import { useSharedState } from "../Hooks/useSharedState";
import { rememberMeState } from "../State/sharedState";
import ThemeRule from "../Components/ThemeRule";
import { useIsMounted } from "../Hooks/useIsMounted";

export interface ChangePasswordProps {
    message?: string;
    userName: string;
}

export enum ChangePasswordRouteParameters {
    then = 'then'
};

function ChangePassword(props: ChangePasswordProps) {
    const { message, userName } = props;

    usePageTitle('Change Password');

    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [checkPassword, setCheckPassword] = useState('');
    const [passwordValid, setPasswordValid] = useState(false);
    const [error, setError] = useState('');
    const [authConfig, ] = useEndpointData(
        useCallback(() => api.apiLoginAuthConfigGet(), []),
        useCallback(async e => {
            console.error('Unexpected response from auth config endpoint:');
            console.error(e);
            console.error(await e.text());
            setError('An unexpected error occurred');
    }, []));

    const [loading, setLoading] = useState(false);

    const setPasswordProps = {
        password: newPassword,
        setPassword: setNewPassword,
        checkPassword,
        setCheckPassword,
        authConfig,
        passwordPlaceholder: 'New Password',
        setPasswordValid,
        startTabIndex: 2,
        currentPassword,
        disabled: loading
    };

    const [rememberMe, ] = useSharedState(rememberMeState);
    const rememberMeProps = {
        allowRememberMe: authConfig?.allowRememberMe,
        tabIndex: 5,
        disabled: loading
    };

    const navigate = useNavigate();
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
                console.error('Unexpected response from login endpoint:');
                console.error(response);
                console.error(await response.text());
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
        if(isMounted.current) navigate(then ?? routes.browseFiles);
    };

    return <SkinnyForm width={350}>
        <Header as="h1" style={{ marginBottom: 0 }}>Change Password<ThemeRule /></Header>
        {
            message && <p><em>{message}</em></p>
        }
        <Form>
            <Form.Field>
                <Input icon="user" iconPosition="left" placeholder="Username" value={userName} disabled={true} />
            </Form.Field>
            <Form.Field>
                <Input autoFocus disabled={loading} icon="key" iconPosition="left" placeholder="Current Password" value={userName} type="password" tabIndex={1} />
            </Form.Field>
            <SetPassword {...setPasswordProps}/>
            <Message error header="Change Password Failed" content={error} />
            <Form.Field>
                <RememberMe {...rememberMeProps} />
                <Button tabIndex={4} primary type="submit" floated="right" onClick={changePassword} disabled={!passwordValid} loading={loading}>Change Password</Button>
            </Form.Field>
        </Form>
    </SkinnyForm>
}

export default ChangePassword;
