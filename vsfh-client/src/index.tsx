import '@fontsource/lato';
// TODO_JU Upgrade to fomantic, use some of its new features (e.g. coloured loading spinner, dynamic less compilation)
import 'semantic-ui-less/definitions/globals/reset.less';
import 'semantic-ui-less/definitions/globals/site.less';
import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);