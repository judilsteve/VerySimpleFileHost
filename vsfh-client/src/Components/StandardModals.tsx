import { useLocation } from "react-router";
import { useNavigate } from "react-router";
import { Modal, Button, Icon } from "semantic-ui-react";
import { routes } from "../App";
import { useSharedState } from "../Hooks/useSharedState";
import { ChangePasswordRouteParameters } from "../Routes/ChangePassword";
import { LoginRouteParameters } from "../Routes/Login";
import { sessionExpiredPromptState, passwordExpiredPromptState } from "../State/sharedState";

function SessionExpiredModal() {
    const navigate = useNavigate();
    const location = useLocation();
    const [sessionExpiredPrompt, setSessionExpiredPrompt] = useSharedState(sessionExpiredPromptState);

    const logIn = () => {
        const then = `${location.pathname}${location.search}${location.hash}`;
        navigate(`${routes.login}?${LoginRouteParameters.then}=${encodeURIComponent(then)}`);
        setSessionExpiredPrompt(false);
    }

    return <Modal size="tiny" open={sessionExpiredPrompt} onClose={() => setSessionExpiredPrompt(false)}>
        <Modal.Header>Session Expired</Modal.Header>
        <Modal.Content>
            <p>Log in again to continue</p>
        </Modal.Content>
        <Modal.Actions>
            <Button onClick={logIn} primary ><Icon name="sign-in" />Log In</Button>
        </Modal.Actions>
    </Modal>;
}

function PasswordExpiredModal() {
    const navigate = useNavigate();
    const location = useLocation();
    const [passwordExpiredPrompt, setPasswordExpiredPrompt] = useSharedState(passwordExpiredPromptState);

    const changePassword = () => {
        const then = `${location.pathname}${location.search}${location.hash}`;
        navigate(`${routes.changePassword}?${ChangePasswordRouteParameters.then}=${encodeURIComponent(then)}`,
            { state: { passwordExpiredPrompt }});
        setPasswordExpiredPrompt(null);
    };

    return <Modal size="tiny" open={!!passwordExpiredPrompt} onClose={() => setPasswordExpiredPrompt(null)}>
        <Modal.Header>Password Expired</Modal.Header>
        <Modal.Content>
            <p>Change your password to continue</p>
        </Modal.Content>
        <Modal.Actions>
            <Button onClick={changePassword} primary ><Icon name="key" />Change Password</Button>
        </Modal.Actions>
    </Modal>;
}

function StandardModals() {
    return <>
        <SessionExpiredModal />
        <PasswordExpiredModal />
    </>;
}

export default StandardModals;