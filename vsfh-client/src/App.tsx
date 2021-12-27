import { BrowserRouter, Routes, Navigate, Route } from 'react-router-dom';
import IconLink from './Components/IconLink';
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
    return <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
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
                <Route path="*" element={<SuspensefulComponent importFunc={() => import('./Routes/Error/NotFound')}/>}/>
            </Routes>
        </BrowserRouter>
        <div style={{ width: '100%', padding: '5px', textAlign: 'right', flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
            <IconLink href="https://github.com/judilsteve/VerySimpleFileHost" name="github" size="large" />
        </div>
    </div>;
}

export default App;