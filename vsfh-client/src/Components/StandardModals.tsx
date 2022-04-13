import { useLocation } from "react-router";
import { Link } from "react-router-dom";
import { Modal, Button, Icon } from "semantic-ui-react";
import { routes } from "../routes";
import { useSharedState } from "../Hooks/useSharedState";
import { ChangePasswordRouteParameters } from "../Routes/ChangePassword";
import { LoginRouteParameters } from "../Routes/Login";
import { sessionExpiredPromptState, passwordExpiredPromptState } from "../State/sharedState";

function SessionExpiredModal() {
    const location = useLocation();
    const [sessionExpiredPrompt, setSessionExpiredPrompt] = useSharedState(sessionExpiredPromptState);

    const then = `${location.pathname}${location.search}${location.hash}`;
    const loginRoute = `${routes.login.url}?${LoginRouteParameters.then}=${encodeURIComponent(then)}`;

    return <Modal size="tiny" open={sessionExpiredPrompt} onClose={() => setSessionExpiredPrompt(false)}>
        <Modal.Header>Session Expired</Modal.Header>
        <Modal.Content>
            <p>Log in again to continue</p>
        </Modal.Content>
        <Modal.Actions>
            <Link to={loginRoute}>
                <Button primary ><Icon name="sign-in" />Log In</Button>
            </Link>
        </Modal.Actions>
    </Modal>;
}

function PasswordExpiredModal() {
    const location = useLocation();
    const [passwordExpiredPrompt, setPasswordExpiredPrompt] = useSharedState(passwordExpiredPromptState);

    const then = `${location.pathname}${location.search}${location.hash}`;
    const changePasswordRoute = `${routes.changePassword.url}?${ChangePasswordRouteParameters.then}=${encodeURIComponent(then)}`;

    return <Modal size="tiny" open={!!passwordExpiredPrompt} onClose={() => setPasswordExpiredPrompt(null)}>
        <Modal.Header>Password Expired</Modal.Header>
        <Modal.Content>
            <p>Change your password to continue</p>
        </Modal.Content>
        <Modal.Actions>
            <Link to={changePasswordRoute}>
                <Button primary ><Icon name="key" />Change Password</Button>
            </Link>
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