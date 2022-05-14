import { h } from 'preact';
import { useCallback } from 'preact/hooks';

// Make a custom hook that listens on hashchange event for useLocation().hash
import { Route, Router } from 'preact-router';
import IconLink from './Components/IconLink';
import SuspensefulComponent from './Routing/SuspensefulRoute';
import Redirect from './Routing/Redirect';
import { pathnameState } from './State/sharedState';
import { routes } from './routes';
import safeWindow from './Utils/safeWindow';
import Browse from './Routes/Browse';

// TODO_JU Current bundle size hogs:
// 1. fontawesome SVGs by a mile (check that these actually get used, maybe there's a way to disable emitting them?)
// 2. zxcvbn but there's no real way to make that smaller
// 3. semantic-ui-react Popup (replace with plain alt-text?)
// 4. semantic-ui-react Form (don't need any of the form plumbing, just the UI parts)

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
            {/* TODO_JU These two routes don't like being pre-rendered as SuspensefulComponent */}
            <SuspensefulComponent path={routes.manageUsers.url} importFunc={() => import('./Routes/Admin/ManageUsers')}/>
            <Route path={routes.browseFiles.url} component={Browse}/>
            <SuspensefulComponent default importFunc={() => import('./Routes/Error/NotFound')}/>
            <SuspensefulComponent path={routes.unauthorised.url} importFunc={() => import('./Routes/Error/Unauthorised')}/>{/* Only here so it can be pre-rendered */}
        </Router>
        <div style={{ width: '100%', padding: '5px', textAlign: 'right', flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
            <IconLink aria-label="VerySimpleFileHost GitHub (Source Code)" href="https://github.com/judilsteve/VerySimpleFileHost" name="github" size="large" />
        </div>
    </div>;
}

export default App;
