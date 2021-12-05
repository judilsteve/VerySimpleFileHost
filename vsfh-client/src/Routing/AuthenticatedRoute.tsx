import CenteredSpinner from "../Components/CenteredSpinner";
import { useSharedState } from "../Hooks/useSharedState";
import { authenticationState, isPasswordExpiredState } from "../State/sharedState";
import { Navigate } from 'react-router-dom';
import { routes } from "../App";
import { ReactNode } from "react";

export interface AuthenticatedRouteProps {
    children: ReactNode;
}

function AuthenticatedRoute(props: AuthenticatedRouteProps) {
    const { children } = props;

    const [isAuthenticated, ] = useSharedState(authenticationState);
    const [passwordExpired, ] = useSharedState(isPasswordExpiredState);

    if(isAuthenticated === null)
        return <CenteredSpinner/>;

    if(!isAuthenticated)
        return <Navigate to={routes.login}/>;

    if(passwordExpired)
        return <Navigate to={routes.changePassword}/>;

    return <>
        { children }
    </>;
}

export default AuthenticatedRoute;