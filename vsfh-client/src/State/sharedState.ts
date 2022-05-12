import { ArchiveFormat } from "../API";
import { SharedPersistedState, SharedState } from "../Hooks/useSharedState";
import safeWindow from "../Utils/safeWindow";

// These are basically lightweight hand-rolled observables
export const rememberMeState = new SharedPersistedState('rememberMe', false);

export const sessionExpiredPromptState = new SharedState(false);

export interface PasswordExpiredPromptParams {
    userName: string;
    message: string;
};
export const passwordExpiredPromptState = new SharedState<PasswordExpiredPromptParams | null>(null);

export const unauthorisedBlockState = new SharedState(false);

export const archiveFormatState = new SharedPersistedState('archiveFormat', ArchiveFormat.Zip);

export const pathnameState = new SharedState(safeWindow?.location.pathname ?? '');

export const hashState = new SharedState(safeWindow?.location.hash ?? '');

safeWindow?.addEventListener('hashchange', () => {
    hashState.setValue(window.location.hash);
})