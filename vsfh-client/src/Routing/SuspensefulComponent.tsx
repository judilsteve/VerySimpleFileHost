import { lazy, Suspense } from "react";
import CenteredSpinner from "../Components/CenteredSpinner";
import { useSharedState } from "../Hooks/useSharedState";
import { unauthorisedBlockState } from "../State/sharedState";

interface SuspensefulComponentProps {
    importFunc: () => Promise<{ default: (props: any) => JSX.Element }>;
}

function SuspensefulComponent(props: SuspensefulComponentProps) {
    const { importFunc } = props;

    const Component = lazy(importFunc);
    const UnauthorisedComponent = lazy(() => import('../Components/Unauthorised'));

    const [unauthorisedBlock, ] = useSharedState(unauthorisedBlockState);

    return <Suspense fallback={<CenteredSpinner />}>
        { unauthorisedBlock ? <UnauthorisedComponent/> : <Component/> }
    </Suspense>
}

export default SuspensefulComponent;
