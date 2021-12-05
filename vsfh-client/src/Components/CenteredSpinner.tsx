import { CircularProgress } from '@material-ui/core';

function CenteredSpinner() {
    return <div style={{margin: 'auto'}}>
        <CircularProgress />
    </div>;
}

export default CenteredSpinner;