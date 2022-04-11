import useLocation from "../Hooks/useLocation";
import Link from "next/link";
import { Modal, Button, Icon } from "semantic-ui-react";
import { routes } from "../Routes";
import { useSharedState } from "../Hooks/useSharedState";
import { ChangePasswordRouteParameters } from "../pages/ChangePassword";
import { LoginRouteParameters } from "../pages/Login";
import { sessionExpiredPromptState, passwordExpiredPromptState } from "../State/sharedState";

function SessionExpiredModal() {
    const location = useLocation();
    const [sessionExpiredPrompt, setSessionExpiredPrompt] = useSharedState(sessionExpiredPromptState);

    const then = `${location.pathname}${location.search}${location.hash}`;
    const loginRoute = `${routes.login}?${LoginRouteParameters.then}=${encodeURIComponent(then)}`;

    return <Modal size="tiny" open={sessionExpiredPrompt} onClose={() => setSessionExpiredPrompt(false)}>
        <Modal.Header>Session Expired</Modal.Header>
        <Modal.Content>
            <p>Log in again to continue</p>
        </Modal.Content>
        <Modal.Actions>
            <Link href={loginRoute}>
                <a><Button primary ><Icon name="sign-in" />Log In</Button></a>
            </Link>
        </Modal.Actions>
    </Modal>;
}

function PasswordExpiredModal() {
    const location = useLocation();
    const [passwordExpiredPrompt, setPasswordExpiredPrompt] = useSharedState(passwordExpiredPromptState);

    const then = `${location.pathname}${location.search}${location.hash}`;
    const changePasswordRoute = `${routes.changePassword}?${ChangePasswordRouteParameters.then}=${encodeURIComponent(then)}`;

    return <Modal size="tiny" open={!!passwordExpiredPrompt} onClose={() => setPasswordExpiredPrompt(null)}>
        <Modal.Header>Password Expired</Modal.Header>
        <Modal.Content>
            <p>Change your password to continue</p>
        </Modal.Content>
        <Modal.Actions>
            <Link href={changePasswordRoute}>
                <a><Button primary ><Icon name="key" />Change Password</Button></a>
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