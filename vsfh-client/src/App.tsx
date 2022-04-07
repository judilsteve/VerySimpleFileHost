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

// TODO_JU Port this whole thing to Next.js to take advantage of build-time initial views.
// https://nextjs.org/docs/migrating/from-create-react-app
// Things that will need to change (apart from what's mentioned in the migration doc):
// - Redirects/path rewrites in the backend for admin route 403s and authenticated route 401s
// - Slug route for AcceptInvite might need to become a query param
// - audit usage of `window` and make sure it only occurs in effects

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