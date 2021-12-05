import { SharedState, useSharedState } from "../Hooks/useSharedState";

interface AuthState {
    isAuthenticated: boolean;
    isAdmin: boolean;
    passwordExpired: boolean;
}

// TODO_JU AsyncSharedState class/hook for things like this
const sharedAuthState = new SharedState<AuthState | null>(null);

export function useAuthState(): AuthState | null {
    const [authState, setAuthState] = useSharedState(sharedAuthState);
    return authState;
}