import { h, Fragment } from 'preact';

import { ComponentChildren } from "preact";
import { useSharedState } from "../Hooks/useSharedState";
import { unauthorisedBlockState } from "../State/sharedState";
import Unauthorised from '../Routes/Error/Unauthorised';

interface AdminRouteProps {
    children: ComponentChildren;
}

function AdminRoute(props: AdminRouteProps) {
    const { children } = props;

    const [unauthorisedBlock, ] = useSharedState(unauthorisedBlockState);

    if(unauthorisedBlock) return <Unauthorised />;
    else return <>{children}</>;
}

export default AdminRoute;
