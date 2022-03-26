import { Location, NavigateFunction } from "react-router";
import { AuthenticationFailureDto, AuthenticationFailureReasonCode } from "../API";
import { routes } from "../App";
import { LoginRouteParameters } from "../Routes/Login";
import { passwordExpiredPromptState, sessionExpiredPromptState, unauthorisedBlockState } from "../State/sharedState";

export async function printResponseError(e: Response, endpointName: string) {
    console.error(`Unexpected response from ${endpointName} endpoint`);
    console.error(e);
    console.error(await e.text());
}

async function tryHandleError(e: Response, location: Location, navigate: NavigateFunction) {
    if(e.status === 401) {
        let responseObject: AuthenticationFailureDto;
        try {
            responseObject = await e.json();
        } catch {
            const then = `${location.pathname}${location.search}${location.hash}`;
            const loginRoute = `${routes.login}?${LoginRouteParameters.then}=${encodeURIComponent(then)}`;
            navigate(loginRoute);
            return true;
        }
        const reasonCode = responseObject.reasonCode;
        if(reasonCode === AuthenticationFailureReasonCode.PasswordExpired) {
            passwordExpiredPromptState.setValue({
                userName: responseObject.userName!,
                message: responseObject.reason!
            });
            return true;
        } else if(reasonCode === AuthenticationFailureReasonCode.SessionExpired) {
            sessionExpiredPromptState.setValue(true);
            return true;
        }
    } else if(e.status === 403) {
        unauthorisedBlockState.setValue(true);
        return true;
    }
    return false;
}

export default tryHandleError;
