import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Configuration, LoginApi } from './app/api';

export const routes = {
  login: '/Login',
  acceptInvite: '/AcceptInvite',
  changePassword: '/ChangePassword',
  manageUsers: '/Admin/ManageUsers',
  browseFiles: '/Browse',
  serverError: '/Error/ServerError',
  unauthorised: '/Error/Unauthorised'
};

const loginApi = new LoginApi(new Configuration({ basePath: "http://localhost:3000" })); // TODO_JU Remove this hack

/**
 * TODO_JU
 * Wrappers for routes requiring authentication/admin privileges
 * Suspense wrapper for dynamic import of route component
 * Global useAuthState hook
 * Some sort of global interceptor (openapi-gen middleware?) to detect 403s due to expired passwords and redirect to /ChangePassword
 * Another of the above to detect 401s due to expired/revoked auth cookies and redirect to /Login
 * ^ Will probably need to send some response headers/content from the backend to indicate this
 */

function App() {
  return <BrowserRouter>
    <Routes>
      {Object.values(routes)
        .map(path => <Route path={path}/>)}
    </Routes>
  </BrowserRouter>;
}

export default App;