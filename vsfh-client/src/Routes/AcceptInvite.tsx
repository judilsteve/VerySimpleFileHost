import { useState } from "react";
import { Button, Form, Input, Message } from "semantic-ui-react";
import RememberMe from "../Components/RememberMe";
import SkinnyForm from "../Components/SkinnyForm";

function AcceptInvite() {
    const [userName, setUserName] = useState('');
    const [password, setPassword] = useState('');
    const [checkPassword, setCheckPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    return <SkinnyForm>
        <>
        TODO_JU Accept Invite page:
         - Code should be in params
         - If no code, send back to login page
         - Login name
         - New password (strength indicator and validation)
         - Confirm new password (check match)
         - Remember me (if allowed by admin)
         - Submit button
         - Field validation
         - Handle errors
        </>
        <Form error={!!error} style={{ maxWidth: 300, margin: "auto" }}>
            <Form.Field>
                <Input tabIndex={1} icon="user" iconPosition="left" placeholder="Username" value={userName} onChange={e => setUserName(e.target.value)} />
            </Form.Field>
            <Form.Field>
                <Input tabIndex={2} icon="password" iconPosition="left" type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
            </Form.Field>
            <Message error header="Activation Failed" content={error} />
            <Form.Field>
                <RememberMe setRememberMe={setRememberMe} />
                <Button tabIndex={3} primary type="submit" floated="right" onClick={activateAccount} disabled={!userName || !password} loading={loading}>Activate Account</Button>
            </Form.Field>
        </Form>
    </SkinnyForm>;
}

export default AcceptInvite;