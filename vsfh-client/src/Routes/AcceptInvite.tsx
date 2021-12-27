import { useCallback, useState } from "react";
import { Button, Form, Header, Input, Message } from "semantic-ui-react";
import { AuthenticationFailureDto, Configuration, LoginApi } from "../API";
import RememberMe from "../Components/RememberMe";
import SkinnyForm from "../Components/SkinnyForm";
import { useNavigate } from "react-router";
import { inviteKeyParamName, routes } from "../App";
import useEndpointData from "../Hooks/useEndpointData";
import SetPassword from "../Components/SetPassword";
import { useParams } from "react-router";
import { usePageTitle } from "../Hooks/usePageTitle";

const api = new LoginApi(new Configuration({ basePath: window.location.origin })); // TODO_JU Shared instances for this?

function AcceptInvite() {
    usePageTitle('Accept Invite');

    const [userName, setUserName] = useState('');
    const [password, setPassword] = useState('');
    const [checkPassword, setCheckPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [passwordValid, setPasswordValid] = useState(false);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const inviteKey = useParams()[inviteKeyParamName];
    const navigate = useNavigate();
    const activateAccount = async () => {
        setLoading(true);
        setError('');
        try {
            await api.loginAcceptInvitePost({ acceptInviteDto: {
                inviteKey,
                userName,
                newPassword: password,
                rememberMe
            }});
        } catch(e) {
            const response = e as Response;
            if(response.status === 401) {
                const responseObject: AuthenticationFailureDto = await response.json();
                setError(responseObject.reason ?? 'Unknown authentication error');
            } else if(response.status === 400) {
                setError(`A user with the name '${userName}' already exists`)
            } else {
                console.error('Unexpected response from login endpoint:');
                console.error(response);
                console.error(await response.text());
                setError('An unexpected error occurred');
            }
            return;
        } finally {
            setLoading(false);
            setPassword('');
            setCheckPassword('');
        }
        navigate(routes.browseFiles);
    };

    const [authConfig, ] = useEndpointData(
        useCallback(() => api.loginAuthConfigGet(), []),
        useCallback(async e => {
            console.error('Unexpected response from auth config endpoint:');
            console.error(e);
            console.error(await e.text());
            setError('An unexpected error occurred');
        }, []));

    const canActivate = inviteKey
        && userName
        && authConfig
        && passwordValid;

    const rememberMeProps = {
        allowRememberMe: authConfig?.allowRememberMe ?? false,
        setRememberMe,
        tabIndex: 5
    };

    const setPasswordProps = {
        password, setPassword,
        checkPassword, setCheckPassword,
        authConfig,
        passwordPlaceholder: 'Password',
        setPasswordValid,
        startTabIndex: 2
    };

    return <SkinnyForm maxWidth={350}>
        <Header as="h1" style={{ marginBottom: 0 }}>Welcome</Header>
        <p>Choose a username and password</p>
        <Form error={!!error}>
            <Form.Field>
                <Input tabIndex={1}
                    icon="user" iconPosition="left"
                    placeholder="Username"
                    value={userName} onChange={e => setUserName(e.target.value)} />
            </Form.Field>
            <SetPassword {...setPasswordProps} />
            <Message error header="Activation Failed" content={error} />
            <Form.Field>
                <RememberMe {...rememberMeProps} />
                <Button tabIndex={4} primary type="submit" floated="right" onClick={activateAccount} disabled={!canActivate} loading={loading}>Activate</Button>
            </Form.Field>
        </Form>
    </SkinnyForm>;
}

export default AcceptInvite;