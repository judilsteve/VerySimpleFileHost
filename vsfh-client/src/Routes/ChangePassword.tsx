import { useCallback, useState } from "react";
import { useNavigate } from "react-router";
import { useSearchParams } from "react-router-dom";
import { Button, Form, Header, Input, Message } from "semantic-ui-react";
import { AuthenticationFailureDto, Configuration, LoginApi } from "../API";
import { routes } from "../App";
import RememberMe from "../Components/RememberMe";
import SetPassword from "../Components/SetPassword";
import SkinnyForm from "../Components/SkinnyForm";
import useEndpointData from "../Hooks/useEndpointData";

export interface ChangePasswordProps {
    message?: string;
    userName: string;
}

export enum ChangePasswordRouteParameters {
    then = 'then'
};

const api = new LoginApi(new Configuration({ basePath: window.location.origin })); // TODO_JU Shared instance for this?

function ChangePassword(props: ChangePasswordProps) {
    const { message, userName } = props;

    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [checkPassword, setCheckPassword] = useState('');
    const [passwordValid, setPasswordValid] = useState(false);
    const [error, setError] = useState('');
    const [authConfig, ] = useEndpointData(
        useCallback(() => api.loginAuthConfigGet(), []),
        useCallback(async e => {
            console.error('Unexpected response from auth config endpoint:');
            console.error(e);
            console.error(await e.text());
            setError('An unexpected error occurred');
    }, []));
    const setPasswordProps = {
        password: newPassword,
        setPassword: setNewPassword,
        checkPassword,
        setCheckPassword,
        authConfig,
        passwordPlaceholder: 'New Password',
        setPasswordValid,
        startTabIndex: 2,
        currentPassword
    };

    const [rememberMe, setRememberMe] = useState(false);
    const rememberMeProps = {
        allowRememberMe: authConfig?.allowRememberMe ?? false,
        setRememberMe,
        tabIndex: 5
    };

    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const then = useSearchParams()[0].get(ChangePasswordRouteParameters.then);
    const changePassword = async () => {
        setLoading(true);
        try {
            const changePasswordAttemptDto = {
                userName,
                currentPassword,
                newPassword,
                rememberMe
            }
            await api.loginChangePasswordPut({ changePasswordAttemptDto });
        } catch(e) {
            const response = e as Response;
            if(response.status !== 401) {
                console.error('Unexpected response from login endpoint:');
                console.error(response);
                console.error(await response.text());
                setError('An unexpected error occurred');
            } else {
                const responseObject: AuthenticationFailureDto = await response.json();
                setError(responseObject.reason ?? 'Unknown authentication error');
            }
            return;
        } finally {
            setLoading(false);
            setCurrentPassword('');
            setNewPassword('');
            setCheckPassword('');
        }
        navigate(then ?? routes.browseFiles);
    };

    return <SkinnyForm maxWidth={350}>
        <Header as="h1" style={{ marginBottom: 0 }}>Change Password</Header>
        {
            message && <p><em>{message}</em></p>
        }
        <Form.Field>
            <Input icon="user" iconPosition="left" placeholder="Username" value={userName} disabled={true} />
        </Form.Field>
        <Form.Field>
            <Input icon="key" iconPosition="left" placeholder="Current Password" value={userName} type="password" tabIndex={1} />
        </Form.Field>
        <SetPassword {...setPasswordProps}/>
        <Message error header="Change Password Failed" content={error} />
        <Form.Field>
            <RememberMe {...rememberMeProps} />
            <Button tabIndex={4} primary type="submit" floated="right" onClick={changePassword} disabled={!passwordValid} loading={loading}>Change Password</Button>
        </Form.Field>
    </SkinnyForm>
}

export default ChangePassword;
