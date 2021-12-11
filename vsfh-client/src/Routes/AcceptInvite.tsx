import { useEffect, useState } from "react";
import { Button, Form, Header, Input, Message } from "semantic-ui-react";
import { AuthConfigDto, AuthenticationFailureDto, AuthenticationFailureReasonCode, Configuration, LoginApi } from "../API";
import RememberMe from "../Components/RememberMe";
import SkinnyForm from "../Components/SkinnyForm";
import zxcvbn from 'zxcvbn';
import ErrorText from "../Components/ErrorText";
import { useNavigate, useParams } from "react-router";
import { routes } from "../App";

const api = new LoginApi(new Configuration({ basePath: window.location.origin })); // TODO_JU Shared instances for this?

const zxcvbnScores = [
    {
        color: 'brown',
        content: 'Catastrophic'
    },
    {
        color: 'orange',
        content: 'Woeful'
    },
    {
        color: 'yellow',
        content: 'Lukewarm'
    },
    {
        color: 'green',
        content: 'Sturdy'
    },
    {
        color: 'teal',
        content: 'Adamantine',
        icon: 'diamond'
    }
]

function AcceptInvite() {
    const [userName, setUserName] = useState('');
    const [password, setPassword] = useState('');
    const [checkPassword, setCheckPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const navigate = useNavigate();
    const inviteKey = useParams()['inviteKey'];
    const activateAccount = async () => {
        setLoading(true);
        setError('');
        const frozenUserName = userName;
        try {
            await api.loginAcceptInvitePost({ acceptInviteDto: {
                inviteKey,
                userName: frozenUserName,
                newPassword: password,
                rememberMe
            }});
        } catch(e) {
            const response = e as Response;
            if(response.status === 401) {
                const responseObject: AuthenticationFailureDto = await response.json();
                setError(responseObject.reason ?? 'Unknown authentication error');
            } else if(response.status === 400) {
                setError(`A user with the name '${frozenUserName}' already exists`)
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
        }
        navigate(routes.browseFiles);
    };

    // TODO_JU Maybe some sort of custom hook to encapsulate this pattern
    const [authConfig, setAuthConfig] = useState<AuthConfigDto | null>(null);
    useEffect(() => {
        let cancel = false;
        (async () => {
            const authConfig = await api.loginAuthConfigGet(); // TODO_JU catch
            if(cancel) return;
            setAuthConfig(authConfig);
        })();
        return () => { cancel = true; }
    }, []);

    const passwordStrength = password ? zxcvbn(password) : null;

    const passwordTooWeak = passwordStrength && authConfig
        && passwordStrength.score < authConfig.minimumPasswordScore!;

    const passwordsMatch = password === checkPassword;

    const canActivate = userName
        && passwordsMatch
        && authConfig
        && passwordStrength
        && !passwordTooWeak;

    const rememberMeProps = {
        allowRememberMe: authConfig?.allowRememberMe!,
        setRememberMe,
        tabIndex: 5
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
            <Form.Field>
                <Form.Input tabIndex={2}
                    action={passwordStrength ? zxcvbnScores[passwordStrength.score] : null} 
                    icon="key" iconPosition="left"
                    type="password" placeholder="Password"
                    value={password} onChange={e => setPassword(e.target.value)}/>
                {passwordTooWeak && <ErrorText>{`Password strength must be at least '${zxcvbnScores[passwordStrength.score].content}'`}</ErrorText>}
                {passwordStrength?.feedback.warning && <p><em>{passwordStrength.feedback.warning}</em></p>}
                {passwordStrength?.feedback.suggestions && passwordStrength.feedback.suggestions.map(s => <p><em>{s}</em></p>)}
            </Form.Field>
            <Form.Field>
                <Input tabIndex={3} icon="key" iconPosition="left" type="password" placeholder="Verify" value={checkPassword} onChange={e => setCheckPassword(e.target.value)} />
                {checkPassword && !passwordsMatch && <ErrorText>Passwords do not match</ErrorText>}
            </Form.Field>
            <Message error header="Activation Failed" content={error} />
            <Form.Field>
                <RememberMe {...rememberMeProps} />
                <Button tabIndex={4} primary type="submit" floated="right" onClick={activateAccount} disabled={!canActivate} loading={loading}>Activate</Button>
            </Form.Field>
        </Form>
    </SkinnyForm>;
}

export default AcceptInvite;