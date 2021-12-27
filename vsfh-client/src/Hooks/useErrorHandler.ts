import { useCallback } from "react";
import { useNavigate } from "react-router";
import { AuthenticationFailureDto, AuthenticationFailureReasonCode } from "../API";
import { routes } from "../App";
import { passwordExpiredPromptState, sessionExpiredPromptState } from "../State/sharedState";
import { useSharedState } from "./useSharedState";

function useErrorHandler() {
    const navigate = useNavigate();

    const [, setPasswordExpiredPrompt] = useSharedState(passwordExpiredPromptState);
    const [, setSessionExpiredPrompt] = useSharedState(sessionExpiredPromptState);

    return useCallback(async (e: Response) => {
        if(e.status === 401) {
            let responseObject: AuthenticationFailureDto;
            try {
                responseObject = await e.json();
            } catch {
                setSessionExpiredPrompt(true);
                return true;
            }
            const reasonCode = responseObject.reasonCode;
            if(reasonCode === AuthenticationFailureReasonCode.PasswordExpired) {
                setPasswordExpiredPrompt({
                    userName: responseObject.userName!,
                    message: responseObject.reason!
                });
                return true;
            } else {
                setSessionExpiredPrompt(true);
                return true;
            }
        } else if(e.status === 403) {
            navigate(routes.unauthorised);
            return true;
        }
        return false;
    }, [navigate, setPasswordExpiredPrompt, setSessionExpiredPrompt]);
}

export default useErrorHandler;
