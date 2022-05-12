import { h } from 'preact';
import { useCallback } from 'preact/hooks';

import { Route, Router } from 'preact-router';
import IconLink from './Components/IconLink';
import Redirect from './Routing/Redirect';
import { pathnameState } from './State/sharedState';
import { routes } from './routes';
import safeWindow from './Utils/safeWindow';

import NotFound from './Routes/Error/NotFound';
import Unauthorised from './Routes/Error/Unauthorised';
import AsyncRoute from 'preact-async-route';
import CenteredSpinner from './Components/CenteredSpinner';
import ManageUsers from './Routes/Admin/ManageUsers';
import Browse from './Routes/Browse';

function App() {
    const handleRouteChange = useCallback(() => {
        pathnameState.setValue(safeWindow?.location.pathname ?? '');
    }, []);

    // TODO_JU Using AsyncRoute here results in this: https://github.com/preactjs/preact-cli/issues/1354
    return <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Router onChange={handleRouteChange}>
            <Redirect path="/" to={routes.browseFiles.url}/>
            <AsyncRoute getComponent={() => import('./Routes/Login').then(module => module.default)} loading={() => <CenteredSpinner/>} path={routes.login.url} />
            <AsyncRoute getComponent={() => import('./Routes/AcceptInvite').then(module=> module.default)} loading={() => <CenteredSpinner/>} path={routes.acceptInvite.url} />
            <AsyncRoute getComponent={() => import('./Routes/ChangePassword').then(module=> module.default)} loading={() => <CenteredSpinner/>} path={routes.changePassword.url} />
            {/*<AsyncRoute getComponent={() => import('./Routes/Admin/ManageUsers').then(module=> module.default)} loading={() => <CenteredSpinner/>} path={routes.manageUsers.url} />
            <AsyncRoute getComponent={() => import('./Routes/Browse').then(module=> module.default)} loading={() => <CenteredSpinner/>} path={routes.browseFiles.url} />*/}
            <Route component={ManageUsers} path={routes.manageUsers.url} />
            <Route component={Browse} path={routes.browseFiles.url} />
            <Route component={NotFound} default />
            <Route component={Unauthorised} path={routes.unauthorised.url} />{/* Only here so it can be pre-rendered */}
        </Router>
        <div style={{ width: '100%', padding: '5px', textAlign: 'right', flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
            <IconLink aria-label="VerySimpleFileHost GitHub (Source Code)" href="https://github.com/judilsteve/VerySimpleFileHost" name="github" size="large" />
        </div>
    </div>;
}

export default App;
