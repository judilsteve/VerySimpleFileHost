import { h, Fragment } from 'preact';

import 'fomantic-ui-less/definitions/modules/modal.less';
import 'fomantic-ui-less/definitions/elements/button.less';
import 'fomantic-ui-less/definitions/elements/icon.less';
import { Modal, Button, Icon } from "semantic-ui-react";
import { routes } from "../routes";
import { useSharedState } from "../Hooks/useSharedState";
import { ChangePasswordRouteParameters } from "../Routes/ChangePassword";
import { LoginRouteParameters } from "../Routes/Login";
import { sessionExpiredPromptState, passwordExpiredPromptState } from "../State/sharedState";
import safeWindow from "../Utils/safeWindow";

function SessionExpiredModal() {
    const [sessionExpiredPrompt, setSessionExpiredPrompt] = useSharedState(sessionExpiredPromptState);

    const location = safeWindow?.location;
    const then = location ? `${location.pathname}${location.search}${location.hash}` : '';
    const loginRoute = `${routes.login.pathname}?${LoginRouteParameters.then}=${encodeURIComponent(then)}`;

    return <Modal size="tiny" open={sessionExpiredPrompt} onClose={() => setSessionExpiredPrompt(false)}>
        <Modal.Header>Session Expired</Modal.Header>
        <Modal.Content>
            <p>Log in again to continue</p>
        </Modal.Content>
        <Modal.Actions>
            <a aria-label="Log In" href={loginRoute}>
                <Button primary ><Icon name="sign-in" />Log In</Button>
            </a>
        </Modal.Actions>
    </Modal>;
}

function PasswordExpiredModal() {
    const [passwordExpiredPrompt, setPasswordExpiredPrompt] = useSharedState(passwordExpiredPromptState);

    const location = safeWindow?.location;
    const then = location ? `${location.pathname}${location.search}${location.hash}` : '';
    const changePasswordRoute = `${routes.changePassword.pathname}?${ChangePasswordRouteParameters.then}=${encodeURIComponent(then)}`;

    return <Modal size="tiny" open={!!passwordExpiredPrompt} onClose={() => setPasswordExpiredPrompt(null)}>
        <Modal.Header>Password Expired</Modal.Header>
        <Modal.Content>
            <p>Change your password to continue</p>
        </Modal.Content>
        <Modal.Actions>
            <a aria-label="Change Password" href={changePasswordRoute}>
                <Button primary ><Icon name="key" />Change Password</Button>
            </a>
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
