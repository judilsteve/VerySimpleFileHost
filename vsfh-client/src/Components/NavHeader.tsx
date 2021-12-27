import { useState, useCallback } from "react";
import { useNavigate } from "react-router";
import { Button, Header, Icon, Message, Modal, Popup } from "semantic-ui-react";
import { loginApi } from "../apiInstances";
import { routes } from "../App";
import IconLink from "./IconLink";

export interface NavHeaderProps {
    pageTitle: string;
}

function NavHeader(props: NavHeaderProps) {
    const { pageTitle } = props;

    const navigate = useNavigate();

    const [loggingOut, setLoggingOut] = useState(false);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const logOut = useCallback(() => {
        let cancel = false;
        (async () => {
            setLoading(true);
            setError('');
            try {
                await loginApi.loginLogoutPost();
            } catch(e) {
                const response = e as Response;
                console.error('Unexpected response from logout endpoint:');
                console.error(e);
                console.error(await response.text());
                if(cancel) return;
                setError('An unexpected error occurred');
                return;
            }
            if(cancel) return;
            navigate(routes.login);
        })();
        return () => { cancel = true; };
    }, [navigate]);

    // TODO_JU Conditionally build this array based on current route and whether or not the user is an admin
    const routeIcons = [
        { href: routes.browseFiles, name: 'folder open', popupContent: 'Browse' },
        { href: routes.manageUsers, name: 'users', popupContent: 'Manage Users' }
    ]

    return <>
        <div style={{ paddingTop: '1rem', display: 'flex', justifyContent: 'space-between' }}>
            <Header as="h1">{pageTitle}</Header>
            <div>
                <Popup trigger={<IconLink style={{ marginRight: '1em' }} href={routes.browseFiles} name="folder open" size="large" />} content="Browse" />
                <Popup trigger={<Icon link name="sign-out" size="large" onClick={() => setLoggingOut(true)} />} content="Log Out" />
            </div>
        </div>
        <Modal size="tiny" open={loggingOut} onClose={() => setLoggingOut(false)}>
            <Modal.Header>Log Out</Modal.Header>
            <Modal.Content>
                <p>Are you sure?</p>
                {error && <Message error content={error} />}
            </Modal.Content>
            <Modal.Actions>
                <Button onClick={logOut} primary loading={loading} ><Icon name="sign-out" />Log Out</Button>
                <Button onClick={() => setLoggingOut(false)} secondary><Icon name="close" />Cancel</Button>
            </Modal.Actions>
        </Modal>
    </>;
}

export default NavHeader;