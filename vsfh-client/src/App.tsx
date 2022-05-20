import { h } from 'preact';
import { useCallback } from 'preact/hooks';

// Make a custom hook that listens on hashchange event for useLocation().hash
import { Route, Router } from 'preact-router';
import IconLink from './Components/IconLink';
import Redirect from './Routing/Redirect';
import { pathnameState } from './State/sharedState';
import { routes } from './routes';
import safeWindow from './Utils/safeWindow';
import Browse from './Routes/Browse';
import ManageUsers from './Routes/Admin/ManageUsers';
import Unauthorised from './Routes/Error/Unauthorised';
import NotFound from './Routes/Error/NotFound';
import Login from './Routes/Login';
import AcceptInvite from './Routes/AcceptInvite';
import ChangePassword from './Routes/ChangePassword';

// TODO_JU Current bundle size hogs:
// 1. fontawesome SVGs by a mile (use fontmin?)
// 2. zxcvbn but there's no real way to make that smaller

function App() {
    const handleRouteChange = useCallback(() => {
        pathnameState.setValue(safeWindow?.location.pathname ?? '');
    }, []);

    return <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Router onChange={handleRouteChange}>
            <Redirect path="/" to={routes.browseFiles.url} />
            <Route path={routes.login.url} component={Login} />
            <Route path={routes.acceptInvite.url} component={AcceptInvite} />
            <Route path={routes.changePassword.url} component={ChangePassword} />
            <Route path={routes.manageUsers.url} component={ManageUsers} />
            <Route path={routes.browseFiles.url} component={Browse} />
            <Route default component={NotFound} />
            <Route path={routes.unauthorised.url} component={Unauthorised} />{/* Only here so it can be pre-rendered */}
        </Router>
        <div style={{ width: '100%', padding: '5px', textAlign: 'right', flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
            <IconLink aria-label="VerySimpleFileHost GitHub (Source Code)" href="https://github.com/judilsteve/VerySimpleFileHost" name="github" size="large" />
        </div>
    </div>;
}

export default App;
