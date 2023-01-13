
import { h } from 'preact';
//import '@fontsource/lato/latin-400'; TODO_JU This is supposed to be bundled now, test and remove from package.json
//import '@fontsource/lato/latin-700';
// TODO_JU Dynamic less compilation: https://fomantic-ui.com/introduction/build-tools.html#variationvariables
import 'fomantic-ui-less/definitions/globals/reset.less';
import 'fomantic-ui-less/definitions/globals/site.less';

import App from './App';

export default function VerySimpleFileHost(props: { pathname?: string }) {
    return <App pathname={props.pathname}/>;
}