import { ArchiveFormat } from "../API";
import { SharedPersistedState } from "../Hooks/useSharedState";

// These are basically lightweight hand-rolled observables
export const rememberMeState = new SharedPersistedState<boolean>('rememberMe', false);

export const archiveFormatState = new SharedPersistedState<ArchiveFormat>('archiveFormat', ArchiveFormat.Zip);
