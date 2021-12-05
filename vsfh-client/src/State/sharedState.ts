import { ArchiveFormat } from "../app/api";
import { SharedPersistedState, SharedState } from "../Hooks/useSharedState";

// These are basically lightweight hand-rolled observables
export const authenticationState = new SharedState<boolean | null>(null);
export const isAdminState = new SharedState<boolean | null>(null);
export const isPasswordExpiredState = new SharedState<boolean | null>(null);

// TODO_JU Figure out how to make string enums work
// Is it an issue with the serverside OpenAPI generation, or the API client generation?
export const archiveFormatState = new SharedPersistedState<ArchiveFormat>('archiveFormat', ArchiveFormat.NUMBER_0);