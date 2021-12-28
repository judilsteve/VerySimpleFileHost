import { useCallback } from "react";
import { AuthenticationFailureDto, AuthenticationFailureReasonCode } from "../API";
import { passwordExpiredPromptState, sessionExpiredPromptState, unauthorisedBlockState } from "../State/sharedState";
import { useSharedState } from "./useSharedState";

function useErrorHandler() {
    const [, setPasswordExpiredPrompt] = useSharedState(passwordExpiredPromptState);
    const [, setSessionExpiredPrompt] = useSharedState(sessionExpiredPromptState);
    const [, setUnauthorisedBlock] = useSharedState(unauthorisedBlockState);

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
            setUnauthorisedBlock(true);
            return true;
        }
        return false;
    }, [setPasswordExpiredPrompt, setSessionExpiredPrompt, setUnauthorisedBlock]);
}

export default useErrorHandler;
