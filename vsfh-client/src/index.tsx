import './index.css';
import { Configuration, LoginApi } from './app/api';

const main = async () => {
  let startRoute = window.location.href;
  let startRouteProps = null;

  const loginApi = new LoginApi(new Configuration({ basePath: "http://localhost:3000" })); // TODO_JU Remove this hack
  const pingResponse = (await loginApi.loginPingGetRaw()).raw;
  if(pingResponse.status === 401) {
    // User is unauthenticated
    startRoute = '/Login'; // TODO_JU Don't use magic strings
  } else if(pingResponse.status === 403) {
    // User's password has expired
    startRoute = '/ChangePassword'; // TODO_JU Don't use magic strings
  } else if(!pingResponse.ok) {
    // What the hell?
    startRoute = '/Error'; // TODO_JU Don't use magic strings
    startRouteProps = {
      message: `Could not connect to server (${pingResponse.status}: ${pingResponse.statusText}): ${await pingResponse.text()}`
    };
  }

  const [
    React,
    ReactDOM,
    { default: App },
    { BrowserRouter, Routes, Route }
  ] = await Promise.all([
    import('react'),
    import('react-dom'),
    import('./App'),
    import('react-router-dom')
  ]);

  ReactDOM.render(
    <React.StrictMode>
      <BrowserRouter>
        <Routes>
          <Route path={"/Login"}/>
          <Route path={"/AcceptInvite"}/>
          <Route path={"/ChangePassword"}/>
          <Route path={"/Admin/Users"}/>
          <Route path={"/Browse"}/>
        </Routes>
      </BrowserRouter>
    </React.StrictMode>,
    document.getElementById('root')
  );
}

main()