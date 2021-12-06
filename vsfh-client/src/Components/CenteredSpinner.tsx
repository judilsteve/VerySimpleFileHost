import { Dimmer, Loader } from 'semantic-ui-react'

function CenteredSpinner() {
    return <Dimmer active>
        <Loader indeterminate />
    </Dimmer>;
}

export default CenteredSpinner;