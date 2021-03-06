
import { h } from 'preact';
import '@fontsource/lato/latin-400';
import '@fontsource/lato/latin-700';
// TODO_JU Upgrade to fomantic, use some of its new features (e.g. coloured loading spinner, dynamic less compilation)
import 'semantic-ui-less/definitions/globals/reset.less';
import 'semantic-ui-less/definitions/globals/site.less';

import App from './App';

export default function VerySimpleFileHost(props: { pathname?: string }) {
    return <App pathname={props.pathname}/>;
}