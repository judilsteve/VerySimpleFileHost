import { ArchiveFormat } from "../API";
import { SharedPersistedState, SharedState } from "../Hooks/useSharedState";

// These are basically lightweight hand-rolled observables
export const authenticationState = new SharedState<boolean | null>(null);
export const isAdminState = new SharedState<boolean | null>(null);
export const isPasswordExpiredState = new SharedState<boolean | null>(null);

export const archiveFormatState = new SharedPersistedState<ArchiveFormat>('archiveFormat', ArchiveFormat.Zip);
