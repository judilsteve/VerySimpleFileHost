import './index.css';

import { Configuration, LoginApi } from './app/api';

const main = async () => {
  const loginApi = new LoginApi(new Configuration({ basePath: 'https://localhost:7270' })); // TODO_JU Remove this hack
  const pingResponse = (await loginApi.loginPingGetRaw()).raw;
  if(pingResponse.status === 401) {
    // User is unauthenticated
  } else if(pingResponse.status === 403) {
    // User's password has expired
  } else if(!pingResponse.ok) {
    // What the hell?
    throw new Error(
      `Could not connect to server (${pingResponse.status}: ${pingResponse.statusText}): ${await pingResponse.text()}`);
  }

  const [
    React,
    ReactDOM,
    { default: App }
  ] = await Promise.all([
    import('react'),
    import('react-dom'),
    import('./App')
  ]);

  ReactDOM.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
    document.getElementById('root')
  );
}

main()