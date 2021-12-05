import { BrowserRouter, Routes, Navigate, Route } from 'react-router-dom';
import LazyRoute from './Routing/LazyRoute';

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
      <LazyRoute path={routes.login} importFunc={() => import('./Routes/Login')}/>
      <LazyRoute path={routes.acceptInvite} importFunc={() => import('./Routes/AcceptInvite')}/>
      <LazyRoute path={routes.changePassword} importFunc={() => import('./Routes/ChangePassword')}/>
      <LazyRoute path={routes.manageUsers} importFunc={() => import('./Routes/Admin/ManageUsers')}/>
      <LazyRoute path={routes.browseFiles} importFunc={() => import('./Routes/Browse')}/>
      <LazyRoute path={routes.serverError} importFunc={() => import('./Routes/Error/ServerError')}/>
      <LazyRoute path={routes.unauthorised} importFunc={() => import('./Routes/Error/Unauthorised')}/>
      <LazyRoute path={routes.notFound} importFunc={() => import('./Routes/Error/NotFound')}/>
      <Route path="*" element={<Navigate to={routes.notFound}/>}/>
    </Routes>
  </BrowserRouter>;
}

export default App;