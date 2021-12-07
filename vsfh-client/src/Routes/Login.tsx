import { useMemo, useState } from "react";
import { Button, Checkbox, Form, Header, Icon, Input } from "semantic-ui-react";
import { LoginAttemptDto } from "../API";

function Login() {
    const [userName, setUserName] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [loading, setLoading] = useState(false);

    const login = async () => {
        try {
            setLoading(true);
            const payload: LoginAttemptDto = {
                userName,
                password,
                rememberMe
            };
            // TODO_JU Hit login endpoint
            await new Promise(() => {});
        } catch(e) {
            // TODO_JU Display errors
        } finally {
            setLoading(false);
            setPassword('');
        }
    };

    return <div style={{ maxWidth: 300, margin: "auto" }}>
        <div style={{ height: "10vh" }}></div>
        <Header as="h1">VSFH</Header>
        <Form style={{ maxWidth: 300, margin: "auto" }}>
            <Form.Field>
                <Input tabIndex={1} iconPosition="left" placeholder="Username" value={userName} onChange={e => setUserName(e.target.value)}>
                    <Icon name="user" />
                    <input />
                </Input>
            </Form.Field>
            <Form.Field>
                <Input tabIndex={2} iconPosition="left" type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)}>
                    <Icon name="key" />
                    <input />
                </Input>
            </Form.Field>
            <Form.Field>
                <Checkbox tabIndex={4} label='Remember me' onChange={e => setRememberMe(rm => !rm)}/>{/* TODO_JU Hide this if the administrator has disabled it */}
                <Button tabIndex={3} primary type="submit" floated="right" onClick={login} loading={loading}>Log In</Button>
            </Form.Field>
            <Form.Field>
                
            </Form.Field>
        </Form>
    </div>;
}

export default Login;   