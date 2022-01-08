import { ArchiveFormat } from "../API";
import { SharedPersistedState, SharedState } from "../Hooks/useSharedState";

// These are basically lightweight hand-rolled observables
export const rememberMeState = new SharedPersistedState('rememberMe', false);

export const sessionExpiredPromptState = new SharedState(false);

// TODO_JU Make this persisted state (just the message)
// Store username separately in another local storage key and set on successful login/invite accept
// Then use the two state keys above for the password change screen
export interface PasswordExpiredPromptParams {
    userName: string;
    message: string;
};
export const passwordExpiredPromptState = new SharedState<PasswordExpiredPromptParams | null>(null);

export const unauthorisedBlockState = new SharedState(false);

export const archiveFormatState = new SharedPersistedState('archiveFormat', ArchiveFormat.Zip);
