import { h } from 'preact';
import { useCallback } from 'preact/hooks';
import { Route, Router } from 'preact-router';
import IconLink from './Components/IconLink';
import Redirect from './Routing/Redirect';
import { pathnameState } from './State/sharedState';
import { routes, routeTitlesByPathname } from './routes';
import safeWindow from './Utils/safeWindow';
import Browse from './Routes/Browse';
import ManageUsers from './Routes/Admin/ManageUsers';
import Unauthorised from './Routes/Error/Unauthorised';
import NotFound from './Routes/Error/NotFound';
import Login from './Routes/Login';
import AcceptInvite from './Routes/AcceptInvite';
import ChangePassword from './Routes/ChangePassword';

function App(props: { pathname?: string }) {
    const handleRouteChange = useCallback(() => {
        // Hack to inject pathname at pre-render time (preact helpfully passes it as a prop)
        const pathname = safeWindow?.location.pathname ?? props.pathname
        pathnameState.setValue(pathname);
        if(safeWindow) safeWindow.document.title = `${routeTitlesByPathname[pathname] ?? routes.notFound.title} - VSFH`;
    }, []);

    return <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Router onChange={handleRouteChange}>
            <Redirect path="/" to={routes.browseFiles.pathname} />
            <Route path={routes.login.pathname} component={Login} />
            <Route path={routes.acceptInvite.pathname} component={AcceptInvite} />
            <Route path={routes.changePassword.pathname} component={ChangePassword} />
            <Route path={routes.manageUsers.pathname} component={ManageUsers} />
            <Route path={routes.browseFiles.pathname} component={Browse} />
            <Route default component={NotFound} />
            <Route path={routes.unauthorised.pathname} component={Unauthorised} />{/* Only here so it can be pre-rendered */}
        </Router>
        <div style={{ width: '100%', padding: '5px', textAlign: 'right', flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
            <IconLink aria-label="VerySimpleFileHost GitHub (Source Code)" href="https://github.com/judilsteve/VerySimpleFileHost" name="github" size="large" />
        </div>
    </div>;
}

export default App;
