import { AuthenticationFailureDto, AuthenticationFailureReasonCode } from "../API";
import { passwordExpiredPromptState, sessionExpiredPromptState, unauthorisedBlockState } from "../State/sharedState";

async function tryHandleError(e: Response) {
    if(e.status === 401) {
        let responseObject: AuthenticationFailureDto;
        try {
            responseObject = await e.json();
        } catch {
            sessionExpiredPromptState.setValue(true);
            return true;
        }
        const reasonCode = responseObject.reasonCode;
        if(reasonCode === AuthenticationFailureReasonCode.PasswordExpired) {
            passwordExpiredPromptState.setValue({
                userName: responseObject.userName!,
                message: responseObject.reason!
            });
            return true;
        } else {
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
