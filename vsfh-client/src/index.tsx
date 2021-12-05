import './index.css';
import { Configuration, LoginApi } from './app/api';

const routes = {
  login: '/Login',
  acceptInvite: '/AcceptInvite',
  changePassword: '/ChangePassword',
  manageUsers: '/ManageUsers',
  browseFiles: '/Browse',
  displayError: '/DisplayError'
}

const main = async () => {
  let startRoute = window.location.href;
  let startRouteProps = null;

  const loginApi = new LoginApi(new Configuration({ basePath: "http://localhost:3000" })); // TODO_JU Remove this hack
  const pingResponse = (await loginApi.loginPingGetRaw()).raw;
  if(pingResponse.status === 401) {
    // User is unauthenticated
    startRoute = routes.login
  } else if(pingResponse.status === 403) {
    // User's password has expired
    startRoute = routes.changePassword
  } else if(!pingResponse.ok) {
    // What the hell?
    startRoute = routes.displayError;
    startRouteProps = {
      message: `Could not connect to server (${pingResponse.status}: ${pingResponse.statusText}): ${await pingResponse.text()}`
    };
  }

  const [
    React,
    ReactDOM,
    { BrowserRouter, Routes, Route }
  ] = await Promise.all([
    import('react'),
    import('react-dom'),
    import('react-router-dom')
  ]);

  // TODO_JU Is there way to do this from within react-router?
  window.location.href = startRoute;

  /**
   * TODO_JU
   * Wrappers for routes requiring authentication/admin privileges
   * Suspense wrapper for dynamic import of route component
   * Global useAuthState hook
   * Some sort of global interceptor (openapi-gen middleware?) to detect 403s due to expired passwords and redirect to /ChangePassword
   * Another of the above to detect 401s due to expired/revoked auth cookies and redirect to /Login
   * ^ Will probably need to send some response headers/content from the backend to indicate this
   */

  ReactDOM.render(
    <React.StrictMode>
      <BrowserRouter>
        <Routes>
          <Route path={routes.login}/>
          <Route path={routes.acceptInvite}/>
          <Route path={routes.changePassword}/>
          <Route path={routes.manageUsers}/>
          <Route path={routes.browseFiles}/>
        </Routes>
      </BrowserRouter>
    </React.StrictMode>,
    document.getElementById('root')
  );
}

main()