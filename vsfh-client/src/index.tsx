
import { h } from 'preact';
import '@fontsource/lato';
// TODO_JU Upgrade to fomantic, use some of its new features (e.g. coloured loading spinner, dynamic less compilation)
import 'semantic-ui-less/definitions/globals/reset.less';
import 'semantic-ui-less/definitions/globals/site.less';

import App from './App';

export default function VerySimpleFileHost(props: { url?: string }) {
    return <App url={props.url}/>;
}