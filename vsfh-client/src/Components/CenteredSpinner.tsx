import { h } from 'preact';
import 'fomantic-ui-less/definitions/elements/loader.less';
import 'fomantic-ui-less/definitions/modules/dimmer.less';
import { Dimmer, Loader } from 'semantic-ui-react'

export interface CenteredSpinnerProps {
    active?: boolean;
}

function CenteredSpinner(props: CenteredSpinnerProps) {
    const active = props.active ?? true;

    return <Dimmer active={active}>
        <Loader active indeterminate />
    </Dimmer>;
}

export default CenteredSpinner;