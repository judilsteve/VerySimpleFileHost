import { h, Fragment } from 'preact';

import { useEffect } from 'preact/hooks';
import { route } from 'preact-router';

interface RedirectProps {
    to: string;
    path: string;
}

function Redirect(props: RedirectProps) {
    useEffect(() => { route(props.to); }, []);
    return <></>;
}

export default Redirect;
