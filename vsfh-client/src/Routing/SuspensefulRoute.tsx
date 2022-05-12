import { h, JSX } from "preact";
import CenteredSpinner from "../Components/CenteredSpinner";

import AsyncRoute from 'preact-async-route';

interface SuspensefulComponentProps {
    importFunc: () => Promise<{ default: (props: any) => JSX.Element }>;
    path?: string;
    default?: boolean;
}

function SuspensefulRoute(props: SuspensefulComponentProps) {
    const { importFunc, path, default: isDefault } = props;

    return <AsyncRoute
        default={isDefault}
        path={path}
        getComponent={() => importFunc().then(m => m.default)}
        loading={() => <CenteredSpinner/>} />
}

export default SuspensefulRoute;
