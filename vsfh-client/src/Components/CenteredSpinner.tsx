// TODO_JU The npm install cannot resolve the deps arghhh https://react.semantic-ui.com/theming

import { Dimmer, Loader } from 'semantic-ui-react'

function CenteredSpinner() {
    return <Dimmer active>
        <Loader indeterminate />
    </Dimmer>;
}

export default CenteredSpinner;