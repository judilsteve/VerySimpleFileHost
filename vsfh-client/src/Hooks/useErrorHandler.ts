import { useCallback } from "react";
import { useLocation, useNavigate } from "react-router";
import { AuthenticationFailureDto, AuthenticationFailureReasonCode } from "../API";
import { routes } from "../App";
import { ChangePasswordProps, ChangePasswordRouteParameters } from "../Routes/ChangePassword";

function useErrorHandler() {
    const navigate = useNavigate();
    const location = useLocation();

    return useCallback(async (e: Response) => {
        if(e.status === 401) {
            let responseObject: AuthenticationFailureDto;
            try {
                responseObject = await e.json();
            } catch {
                navigate(routes.login);
                return true;
            }
            const reasonCode = responseObject.reasonCode;
            if(reasonCode === AuthenticationFailureReasonCode.PasswordExpired) {
                const changePasswordProps: ChangePasswordProps = {
                    message: responseObject.reason!,
                    userName: responseObject.userName!
                };
                let then = `${location.pathname}${location.search}${location.hash}`; // TODO_JU Test this
                const destination = `${routes.changePassword}?${ChangePasswordRouteParameters.then}=${encodeURIComponent(then)}`;
                navigate(destination, { state: changePasswordProps });
                return true;
            } else {
                navigate(routes.login);
                return true;
            }
        } else if(e.status === 403) {
            navigate(routes.unauthorised);
            return true;
        }
        return false;
    }, [navigate, location]);
}

export default useErrorHandler;
