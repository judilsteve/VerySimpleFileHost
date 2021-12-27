import { useCallback, useEffect, useState } from "react";

function useEndpointData<T>(
    getEndpointData: () => Promise<T>,
    handleError?: (error: any) => Promise<void> | void)
    : [T | undefined, boolean, () => void] {

    const [endpointData, setEndpointData] = useState<T | undefined>(undefined);

    const reloadEndpointData = useCallback(() => {
        setEndpointData(undefined);
        let cancel = false;
        (async () => {
            let newEndpointData;
            try {
                newEndpointData = await getEndpointData();
            } catch(e) {
                if(handleError) {
                    await handleError(e);
                    return;
                }
                else throw e;
            }
            if(!cancel) setEndpointData(newEndpointData);
        })();
        return () => { cancel = true; }
    }, [getEndpointData, handleError]);

    useEffect(reloadEndpointData, [reloadEndpointData]);

    return [endpointData, !endpointData, reloadEndpointData];
}

export default useEndpointData;
