import { useCallback, useState } from "react";
import { useNavigate } from "react-router";
import { useSearchParams } from "react-router-dom";
import { Button, Form, Header, Input, Message } from "semantic-ui-react";
import { Configuration, LoginApi } from "../API";
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

    const [password, setPassword] = useState('');
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
        password,
        setPassword,
        checkPassword,
        setCheckPassword,
        authConfig,
        passwordPlaceholder: 'New Password',
        setPasswordValid,
        startTabIndex: 1
    };

    const [rememberMe, setRememberMe] = useState(false);
    const rememberMeProps = {
        allowRememberMe: authConfig?.allowRememberMe ?? false,
        setRememberMe,
        tabIndex: 4
    };

    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const then = useSearchParams()[0].get(ChangePasswordRouteParameters.then);
    const changePassword = async () => {
        setLoading(true);
        try {
            // TODO_JU
        } catch(e) {

        } finally {
            setLoading(false);
            setPassword('');
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
        <SetPassword {...setPasswordProps}/>
        <Message error header="Change Password Failed" content={error} />
        <Form.Field>
            <RememberMe {...rememberMeProps} />
            <Button tabIndex={3} primary type="submit" floated="right" onClick={changePassword} disabled={!passwordValid} loading={loading}>Change Password</Button>
        </Form.Field>
    </SkinnyForm>
}

export default ChangePassword;
