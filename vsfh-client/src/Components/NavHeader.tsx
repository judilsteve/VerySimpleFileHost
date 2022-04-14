import { useState, useMemo, useCallback } from "preact/hooks";
import { Button, Header, Icon, Message, Modal, Popup, SemanticICONS } from "semantic-ui-react";
import { loginApi } from "../apiInstances";
import { routes } from "../routes";
import useEndpointData from "../Hooks/useEndpointData";
import { useIsMounted } from "../Hooks/useIsMounted";
import { printResponseError } from "../Utils/tryHandleError";
import StandardModals from "./StandardModals";
import ThemeRule from "./ThemeRule";
import { route } from "preact-router";

export interface NavHeaderProps {
    pageTitle: string;
}

interface RouteLink {
    route: string;
    icon: SemanticICONS;
    name: string;
    adminOnly: boolean;
}

const routeLinks: RouteLink[] = [
    {
        route: routes.browseFiles.url,
        icon: 'folder open',
        name: 'Browse',
        adminOnly: false
    },
    {
        route: routes.manageUsers.url,
        icon: 'users',
        name: 'Manage Users',
        adminOnly: true
    },
    {
        route: routes.changePassword.url,
        icon: 'key',
        name: 'Change Password',
        adminOnly: false
    }
];

const getAuthStatus = () => loginApi.apiLoginAuthStatusGet();

function NavHeader(props: NavHeaderProps) {
    const { pageTitle } = props;

    const [loggingOut, setLoggingOut] = useState(false);

    const [authStatus, , ] = useEndpointData(getAuthStatus, useCallback(async e => printResponseError(e, 'auth status'), []));
    const { isAdministrator } = authStatus ?? { isAdministrator: false };

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const isMounted = useIsMounted();
    const logOut = async () => {
        if(loading) return;
        setLoading(true);
        setError('');
        try {
            await loginApi.apiLoginLogoutPost();
        } catch(e) {
            await printResponseError(e as Response, 'logout');
            if(isMounted.current) setError('An unexpected error occurred');
            return;
        }
        if(isMounted.current) route(routes.login);
    };

    const { pathname } = useLocation();
    const links = useMemo(() => routeLinks
        .filter(r => r.route !== pathname)
        .filter(r => isAdministrator || !r.adminOnly)
    , [isAdministrator, pathname]);

    const linkIcons = links.map(l => {
        const iconLink = <a to={l.route}>
            <Icon link style={{ marginRight: '1em' }} name={l.icon} size="large" />
        </a>;
        // Small offset prevents the popup flashing in and out when the mouse is right on the bottom edge of the icon
        return <Popup key={l.route} trigger={iconLink} offset={[0,5]} content={l.name} />;
    });

    return <>
        <div style={{ paddingTop: '1rem', display: 'flex', justifyContent: 'space-between' }}>
            <Header as="h1" style={{ marginBottom: 0 }}>{pageTitle}</Header>
            <div>
                { linkIcons }
                <Popup trigger={<Icon link name="sign-out" size="large" onClick={() => setLoggingOut(true)} />} content="Log Out" />
            </div>
        </div>
        <ThemeRule />
        <Modal size="tiny" open={loggingOut} onClose={() => setLoggingOut(false)} closeOnDimmerClick={!loading} closeOnEscape={!loading}>
            <Modal.Header>Log Out</Modal.Header>
            <Modal.Content>
                <p>Are you sure?</p>
                {error && <Message error header="Logout Failed" content={error} />}
            </Modal.Content>
            <Modal.Actions>
                <Button onClick={logOut} primary loading={loading} ><Icon name="sign-out" />Log Out</Button>
                <Button onClick={() => setLoggingOut(false)} secondary disabled={loading}><Icon name="close" />Cancel</Button>
            </Modal.Actions>
        </Modal>
        <StandardModals />
    </>;
}

export default NavHeader;