import { BrowserRouter, Routes, Navigate, Route } from 'react-router-dom';
import SuspensefulComponent from './Routing/SuspensefulComponent';

export const routes = {
  login: '/Login',
  acceptInvite: '/AcceptInvite',
  changePassword: '/ChangePassword',
  manageUsers: '/Admin/ManageUsers',
  browseFiles: '/Browse',
  serverError: '/Error/ServerError',
  unauthorised: '/Error/Unauthorised',
  notFound: '/Error/NotFound'
};

function App() {
  return <BrowserRouter>
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
  </BrowserRouter>;
}

export default App;