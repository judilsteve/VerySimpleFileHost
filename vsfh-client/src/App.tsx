import { BrowserRouter, Routes, Navigate, Route } from 'react-router-dom';
import { Icon } from 'semantic-ui-react';
import SuspensefulComponent from './Routing/SuspensefulComponent';

export const inviteKeyParamName = 'inviteKey';
export const routes = {
    login: '/Login',
    acceptInvite: `/AcceptInvite/:${inviteKeyParamName}`,
    changePassword: '/ChangePassword',
    manageUsers: '/Admin/ManageUsers',
    browseFiles: '/Browse',
    serverError: '/Error/ServerError',
    unauthorised: '/Error/Unauthorised',
    notFound: '/Error/NotFound'
};

function App() {
    return <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', justifyContent: 'space-between' }}>
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Navigate to={routes.browseFiles}/>}/>
                <Route path={routes.login} element={<SuspensefulComponent importFunc={() => import('./Routes/Login')}/>}/>
                <Route path={routes.acceptInvite} element={<SuspensefulComponent importFunc={() => import('./Routes/AcceptInvite')}/>}/>
                <Route path={routes.changePassword} element={<SuspensefulComponent importFunc={() => import('./Routes/ChangePassword')}/>}/>
                <Route path={routes.manageUsers} element={<SuspensefulComponent importFunc={() => import('./Routes/Admin/ManageUsers')}/>}/>
                <Route path={routes.browseFiles} element={<SuspensefulComponent importFunc={() => import('./Routes/Browse')}/>}/>
                <Route path={routes.serverError} element={<SuspensefulComponent importFunc={() => import('./Routes/Error/ServerError')}/>}/>
                <Route path={routes.unauthorised} element={<SuspensefulComponent importFunc={() => import('./Routes/Error/Unauthorised')}/>}/>
                <Route path={routes.notFound} element={<SuspensefulComponent importFunc={() => import('./Routes/Error/NotFound')}/>}/>
                <Route path="*" element={<Navigate to={routes.notFound}/>}/>
            </Routes>
        </BrowserRouter>
        <div style={{ width: '100%', padding: '5px', textAlign: 'right' }}>
            <a style={{ all: 'unset' }} href="https://github.com/judilsteve/VerySimpleFileHost">
                <Icon link name="github" size="large" />
            </a>
        </div>
    </div>;
}

export default App;