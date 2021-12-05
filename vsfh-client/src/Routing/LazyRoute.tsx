import { lazy, ReactNode, Suspense } from "react";
import { Route } from "react-router-dom";
import CenteredSpinner from "../Components/CenteredSpinner";

interface SuspensefulComponentProps {
    children: ReactNode
}

function SuspensefulComponent(props: SuspensefulComponentProps) {
    const { children } = props;

    return <Suspense fallback={CenteredSpinner}>
        { children }
    </Suspense>
}

export interface LazyRouteProps {
    path: string;
    importFunc: () => Promise<{ default: () => JSX.Element }>;
}

function LazyRoute(props: LazyRouteProps) {
    const { path, importFunc } = props;

    return <Route
        path={path}
        element={<SuspensefulComponent>{lazy(importFunc)}</SuspensefulComponent>}
    />;
}

export default LazyRoute;
