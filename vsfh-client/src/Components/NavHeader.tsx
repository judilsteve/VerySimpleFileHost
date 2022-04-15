import { useState, useMemo, useCallback } from "react";
import { useLocation } from "react-router";
import { useNavigate } from "react-router";
import { Link } from "react-router-dom";
import 'semantic-ui-less/definitions/elements/button.less';
import 'semantic-ui-less/definitions/elements/header.less';
import 'semantic-ui-less/definitions/elements/icon.less';
import 'semantic-ui-less/definitions/collections/message.less';
import 'semantic-ui-less/definitions/modules/modal.less';
import 'semantic-ui-less/definitions/modules/popup.less';
import { Button, Header, Icon, Message, Modal, Popup, SemanticICONS } from "semantic-ui-react";
import { loginApi } from "../apiInstances";
import { routes } from "../App";
import useEndpointData from "../Hooks/useEndpointData";
import { useIsMounted } from "../Hooks/useIsMounted";
import { printResponseError } from "../Utils/tryHandleError";
import StandardModals from "./StandardModals";
import ThemeRule from "./ThemeRule";

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
        route: routes.browseFiles,
        icon: 'folder open',
        name: 'Browse',
        adminOnly: false
    },
    {
        route: routes.manageUsers,
        icon: 'users',
        name: 'Manage Users',
        adminOnly: true
    },
    {
        route: routes.changePassword,
        icon: 'key',
        name: 'Change Password',
        adminOnly: false
    }
];

const getAuthStatus = () => loginApi.apiLoginAuthStatusGet();

function NavHeader(props: NavHeaderProps) {
    const { pageTitle } = props;

    const navigate = useNavigate();

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
        } finally {
            if(isMounted.current) setLoading(false);
        }
        if(isMounted.current) navigate(routes.login);
    };

    const { pathname } = useLocation();
    const links = useMemo(() => routeLinks
        .filter(r => r.route !== pathname)
        .filter(r => isAdministrator || !r.adminOnly)
    , [isAdministrator, pathname]);

    const linkIcons = links.map(l => {
        const iconLink = <Link to={l.route}>
            <Icon link style={{ marginRight: '1em' }} name={l.icon} size="large" />
        </Link>;
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