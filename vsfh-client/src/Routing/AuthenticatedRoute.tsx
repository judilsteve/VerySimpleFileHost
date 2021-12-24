import CenteredSpinner from "../Components/CenteredSpinner";
import { useSharedState } from "../Hooks/useSharedState";
import { authenticationState, isPasswordExpiredState } from "../State/sharedState";
import { useNavigate } from 'react-router-dom';
import { routes } from "../App";
import { ReactNode } from "react";

export interface AuthenticatedRouteProps {
    children: ReactNode;
}

function AuthenticatedRoute(props: AuthenticatedRouteProps) {
    const { children } = props;

    const [isAuthenticated, ] = useSharedState(authenticationState);
    const [passwordExpired, ] = useSharedState(isPasswordExpiredState);

    const navigate = useNavigate();

    if(isAuthenticated === null)
        return <CenteredSpinner/>;

    if(!isAuthenticated)
        navigate(routes.login);
    if(passwordExpired)
        navigate(routes.login);

    return <>
        { children }
    </>;
}

export default AuthenticatedRoute;