import 'semantic-ui-less/definitions/elements/loader.less';
import 'semantic-ui-less/definitions/modules/dimmer.less';
import { Dimmer, Loader } from 'semantic-ui-react'

export interface CenteredSpinnerProps {
    active?: boolean;
}

function CenteredSpinner(props: CenteredSpinnerProps) {
    const active = props.active ?? true;

    return <Dimmer active={active}>
        <Loader indeterminate />
    </Dimmer>;
}

export default CenteredSpinner;