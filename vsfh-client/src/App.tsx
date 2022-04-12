import '@fontsource/lato';
import 'semantic-ui-less/semantic.less'; // TODO_JU Upgrade to fomantic, revisit CSP `script-src 'unsafe-inline'`

import { BrowserRouter, Routes, Navigate, Route } from 'react-router-dom';
import IconLink from './Components/IconLink';
import SuspensefulComponent from './Routing/SuspensefulComponent';

export const inviteKeyParamName = 'inviteKey';
export const routes = {
    login: '/Login',
    acceptInvite: `/AcceptInvite/:${inviteKeyParamName}`,
    changePassword: '/ChangePassword',
    manageUsers: '/Admin/ManageUsers',
    browseFiles: '/Browse'
};

function App() {
    return <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Navigate to={routes.browseFiles}/>}/>
                <Route path={routes.login} element={<SuspensefulComponent importFunc={() => import('./Routes/Login')}/>}/>
                <Route path={routes.acceptInvite} element={<SuspensefulComponent importFunc={() => import('./Routes/AcceptInvite')}/>}/>
                <Route path={routes.changePassword} element={<SuspensefulComponent importFunc={() => import('./Routes/ChangePassword')}/>}/>
                <Route path={routes.manageUsers} element={<SuspensefulComponent importFunc={() => import('./Routes/Admin/ManageUsers')}/>}/>
                <Route path={routes.browseFiles} element={<SuspensefulComponent importFunc={() => import('./Routes/Browse')}/>}/>
                <Route path="*" element={<SuspensefulComponent importFunc={() => import('./Routes/Error/NotFound')}/>}/>
            </Routes>
        </BrowserRouter>
        <div style={{ width: '100%', padding: '5px', textAlign: 'right', flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
            <IconLink aria-label="VerySimpleFileHost GitHub (Source Code)" href="https://github.com/judilsteve/VerySimpleFileHost" name="github" size="large" />
        </div>
    </div>;
}

export default App;
