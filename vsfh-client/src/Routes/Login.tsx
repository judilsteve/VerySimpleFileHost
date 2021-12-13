import { useCallback, useState } from "react";
import { useNavigate } from "react-router";
import { useSearchParams } from "react-router-dom";
import { Button, Form, Header, Input, Message } from "semantic-ui-react";
import { AuthenticationFailureDto, AuthenticationFailureReasonCode, Configuration, LoginApi } from "../API";
import { routes } from "../App";
import RememberMe from "../Components/RememberMe";
import SkinnyForm from "../Components/SkinnyForm";
import useEndpointData from "../Hooks/useEndpointData";
import { ChangePasswordProps, ChangePasswordRouteParameters } from "./ChangePassword";

export enum LoginRouteParameters {
    then = 'then'
};

const api = new LoginApi(new Configuration({ basePath: window.location.origin })); // TODO_JU Remove basePath hack?

function Login() {
    const [userName, setUserName] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const navigate = useNavigate();
    const then = useSearchParams()[0].get(LoginRouteParameters.then);

    const login = async () => {
        setLoading(true);
        setError('');
        try {
            await api.loginPost({ loginAttemptDto: {
                userName,
                password,
                rememberMe
            }});
        } catch(e) {
            const response = e as Response;
            if(response.status !== 401) {
                console.error('Unexpected response from login endpoint:');
                console.error(response);
                console.error(await response.text());
                setError('An unexpected error occurred');
            } else {
                const responseObject: AuthenticationFailureDto = await response.json();
                const reasonCode = responseObject.reasonCode;
                if(reasonCode === AuthenticationFailureReasonCode.PasswordExpired) {
                    const changePasswordProps: ChangePasswordProps = {
                        message: responseObject.reason!,
                        userName: userName
                    };
                    let destination = routes.changePassword;
                    if(then) destination += `?${ChangePasswordRouteParameters.then}=${then}`;
                    navigate(destination, { state: changePasswordProps });
                }
                else setError(responseObject.reason ?? 'Unknown authentication error');
            }
            return;
        } finally {
            setLoading(false);
            setPassword('');
        }
        navigate(then ?? routes.browseFiles);
    };

    const [authConfig, ] = useEndpointData(
        useCallback(() => api.loginAuthConfigGet(), []),
        useCallback(async e => {
            console.error('Unexpected response from auth config endpoint:');
            console.error(e);
            console.error(await e.text());
            setError('An unexpected error occurred');
    }, []));

    const rememberMeProps = {
        allowRememberMe: authConfig?.allowRememberMe ?? false,
        setRememberMe,
        tabIndex: 4
    };

    return <SkinnyForm>
        <Header as="h1">VSFH</Header>
        <Form error={!!error}>
            <Form.Field>
                <Input tabIndex={1} icon="user" iconPosition="left" placeholder="Username" value={userName} onChange={e => setUserName(e.target.value)} />
            </Form.Field>
            <Form.Field>
                <Input tabIndex={2} icon="key" iconPosition="left" type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
            </Form.Field>
            <Message error header="Login Failed" content={error} />
            <Form.Field>
                <RememberMe {...rememberMeProps} />
                <Button tabIndex={3} primary type="submit" floated="right" onClick={login} disabled={!userName || !password} loading={loading}>Log In</Button>
            </Form.Field>
        </Form>
    </SkinnyForm>;
}

export default Login;
