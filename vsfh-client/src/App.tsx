import '@fontsource/lato';
import 'semantic-ui-less/semantic.less'; // TODO_JU Upgrade to fomantic

// TODO_JU How to dynamically choose StaticRouter, set location, and bypass SuspensefulComponent for pre-rendering?
import { BrowserRouter, Routes, Navigate, Route } from 'react-router-dom';
import { StaticRouter } from 'react-router-dom/server';
import IconLink from './Components/IconLink';
import SuspensefulComponent from './Routing/SuspensefulComponent';

import { routes } from './routes';

function App(props) {
    return <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        {JSON.stringify(props)}
        <StaticRouter location="TODO_JU">
            <Routes>
                <Route path="/" element={<Navigate to={routes.browseFiles.url}/>}/>
                <Route path={routes.login.url} element={<SuspensefulComponent importFunc={() => import('./Routes/Login')}/>}/>
                <Route path={routes.acceptInvite.url} element={<SuspensefulComponent importFunc={() => import('./Routes/AcceptInvite')}/>}/>
                <Route path={routes.changePassword.url} element={<SuspensefulComponent importFunc={() => import('./Routes/ChangePassword')}/>}/>
                <Route path={routes.manageUsers.url} element={<SuspensefulComponent importFunc={() => import('./Routes/Admin/ManageUsers')}/>}/>
                <Route path={routes.browseFiles.url} element={<SuspensefulComponent importFunc={() => import('./Routes/Browse')}/>}/>
                <Route path="*" element={<SuspensefulComponent importFunc={() => import('./Routes/Error/NotFound')}/>}/>
            </Routes>
        </StaticRouter>
        <div style={{ width: '100%', padding: '5px', textAlign: 'right', flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
            <IconLink aria-label="VerySimpleFileHost GitHub (Source Code)" href="https://github.com/judilsteve/VerySimpleFileHost" name="github" size="large" />
        </div>
    </div>;
}

export default App;
