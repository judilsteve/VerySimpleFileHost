import '@fontsource/lato';
// TODO_JU Upgrade to fomantic, use some of its new features (e.g. coloured loading spinner, dynamic less compilation)
import 'semantic-ui-less/definitions/globals/reset.less';
import 'semantic-ui-less/definitions/globals/site.less';

import App from './App';

export default function VerySimpleFileHost() {
    return <App />;
}