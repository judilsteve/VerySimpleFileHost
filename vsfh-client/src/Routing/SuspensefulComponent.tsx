import { lazy, Suspense } from "react";
import CenteredSpinner from "../Components/CenteredSpinner";
import Unauthorised from "../Components/Unauthorised";
import { useSharedState } from "../Hooks/useSharedState";
import { unauthorisedBlockState } from "../State/sharedState";

interface SuspensefulComponentProps {
    importFunc: () => Promise<{ default: (props: any) => JSX.Element }>;
}

function SuspensefulComponent(props: SuspensefulComponentProps) {
    const { importFunc } = props;

    const Component = lazy(importFunc);

    const [unauthorisedBlock, ] = useSharedState(unauthorisedBlockState);

    if(unauthorisedBlock) return <Unauthorised />;

    return <Suspense fallback={<CenteredSpinner />}>
        <Component/>
    </Suspense>
}

export default SuspensefulComponent;
