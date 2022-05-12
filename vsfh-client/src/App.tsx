import { h } from 'preact';
import { useCallback } from 'preact/hooks';

// Make a custom hook that listens on hashchange event for useLocation().hash
import { Router } from 'preact-router';
import IconLink from './Components/IconLink';
import SuspensefulComponent from './Routing/SuspensefulRoute';
import Redirect from './Routing/Redirect';
import { pathnameState } from './State/sharedState';
import { routes } from './routes';
import safeWindow from './Utils/safeWindow';

function App() {
    const handleRouteChange = useCallback(() => {
        pathnameState.setValue(safeWindow?.location.pathname ?? '');
    }, []);

    return <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Router onChange={handleRouteChange}>
            <Redirect path="/" to={routes.browseFiles.url}/>
            <SuspensefulComponent path={routes.login.url} importFunc={() => import('./Routes/Login')}/>
            <SuspensefulComponent path={routes.acceptInvite.url} importFunc={() => import('./Routes/AcceptInvite')}/>
            <SuspensefulComponent path={routes.changePassword.url} importFunc={() => import('./Routes/ChangePassword')}/>
            <SuspensefulComponent path={routes.manageUsers.url} importFunc={() => import('./Routes/Admin/ManageUsers')}/>
            <SuspensefulComponent path={routes.browseFiles.url} importFunc={() => import('./Routes/Browse')}/>
            <SuspensefulComponent default importFunc={() => import('./Routes/Error/NotFound')}/>
            <SuspensefulComponent path={routes.unauthorised.url} importFunc={() => import('./Routes/Error/Unauthorised')}/>{/* Only here so it can be pre-rendered */}
        </Router>
        <div style={{ width: '100%', padding: '5px', textAlign: 'right', flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
            <IconLink aria-label="VerySimpleFileHost GitHub (Source Code)" href="https://github.com/judilsteve/VerySimpleFileHost" name="github" size="large" />
        </div>
    </div>;
}

export default App;
