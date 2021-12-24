import CenteredSpinner from "../Components/CenteredSpinner";
import { useSharedState } from "../Hooks/useSharedState";
import { isAdminState } from "../State/sharedState";
import { Navigate } from 'react-router-dom';
import { routes } from "../App";
import { ReactNode } from "react";
import AuthenticatedRoute from "./AuthenticatedRoute";

export interface AdminRouteProps {
    children: ReactNode;
}

function AdminRoute(props: AdminRouteProps) {
    const { children } = props;

    const [isAdmin, ] = useSharedState(isAdminState);

    if(isAdmin === null)
        return <CenteredSpinner/>;

    if(!isAdmin)
        return <Navigate to={routes.unauthorised}/>;

    return <AuthenticatedRoute>
        { children }
    </AuthenticatedRoute>;
}

export default AdminRoute;