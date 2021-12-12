import { Button, Form, Header } from "semantic-ui-react";
import RememberMe from "../Components/RememberMe";
import SetPassword from "../Components/SetPassword";
import SkinnyForm from "../Components/SkinnyForm";

function ChangePassword(props: ChangePasswordProps) {
    // TODO_JU Message if redirected for expired password
    // TODO_JU Validation
    // TODO_JU Tab indices
    // TODO_JU Error handling

    const message = 'TODO_JU';

    const [password, setPassword] = useState('')
    const setPasswordProps = {

    }

    return <SkinnyForm maxWidth={350}>
        <Header as="h1" style={{ marginBottom: 0 }}>Change Password</Header>
        {
            message && <p><em>{message}</em></p>
        }
        <Form.Field>
            <Input tabIndex={2}
                    action={passwordStrength ? zxcvbnScores[passwordStrength.score] : null} 
                    icon="key" iconPosition="left"
                    type="password" placeholder={passwordPlaceholder}
                    value={password} onChange={e => setPassword(e.target.value)}/>
        </Form.Field>
        <SetPassword {...setPasswordProps}/>
        <Form.Field>
            <RememberMe {...rememberMeProps} />
            <Button tabIndex={4} primary type="submit" floated="right" onClick={changePassword} disabled={!canChangePassword} loading={loading}>Change Password</Button>
        </Form.Field>
    </SkinnyForm>
}

export default ChangePassword;
