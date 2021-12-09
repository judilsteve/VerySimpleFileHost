import { useState } from "react";
import { useParams, useNavigate } from "react-router";
import { Button, Form, Header, Input, Message } from "semantic-ui-react";
import { AuthenticationFailureDto, AuthenticationFailureReasonCode, Configuration, LoginApi } from "../API";
import { routes } from "../App";
import RememberMe from "../Components/RememberMe";
import SkinnyForm from "../Components/SkinnyForm";

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
    const params = useParams();

    const login = async () => {
        try {
            setLoading(true);
            setError('');
            console.debug(window.location.origin);
            await api.loginPost({ loginAttemptDto: {
                userName,
                password,
                rememberMe
            }});
            navigate(params[LoginRouteParameters.then] ?? routes.browseFiles);
        } catch(e) {
            const response = e as Response;
            if(response.status !== 401) {
                console.error('Unexpected response from login endpoint:');
                console.error(response);
                console.error(await response.text());
                setError('An unexpected error occurred.');
            } else {
                const responseObject: AuthenticationFailureDto = await response.json();
                const reasonCode = responseObject.reasonCode;
                if(reasonCode === AuthenticationFailureReasonCode.PasswordExpired) navigate(routes.changePassword);
                else setError(responseObject.reason ?? 'Unknown authentication error');
            }
        } finally {
            setLoading(false);
            setPassword('');
        }
    };

    return <SkinnyForm>
        <Header as="h1">VSFH</Header>
        <Form error={!!error} style={{ maxWidth: 300, margin: "auto" }}>
            <Form.Field>
                <Input tabIndex={1} icon="user" iconPosition="left" placeholder="Username" value={userName} onChange={e => setUserName(e.target.value)} />
            </Form.Field>
            <Form.Field>
                <Input tabIndex={2} icon="key" iconPosition="left" type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
            </Form.Field>
            <Message error header="Login Failed" content={error} />
            <Form.Field>
                <RememberMe setRememberMe={setRememberMe} />
                <Button tabIndex={3} primary type="submit" floated="right" onClick={login} disabled={!userName || !password} loading={loading}>Log In</Button>
            </Form.Field>
        </Form>
    </SkinnyForm>;
}

export default Login;
