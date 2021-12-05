import { lazy, Suspense } from "react";
import CenteredSpinner from "../Components/CenteredSpinner";

interface SuspensefulComponentProps {
    importFunc: () => Promise<{ default: () => JSX.Element }>;
}

function SuspensefulComponent(props: SuspensefulComponentProps) {
    const { importFunc } = props;

    const Component = lazy(importFunc);

    return <Suspense fallback={<CenteredSpinner />}>
        <Component/>
    </Suspense>
}

export default SuspensefulComponent;
