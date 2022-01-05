import { useCallback, useEffect, useState } from "react";
import { useIsMounted } from "./useIsMounted";

// TODO_JU Remove or improve this, it's all sorts of janky
function useEndpointData<T>(
    getEndpointData: () => Promise<T>,
    handleError?: (error: any) => Promise<void> | void)
    : [T | undefined, boolean, () => void] {

    const [endpointData, setEndpointData] = useState<T | undefined>(undefined);
    const isMounted = useIsMounted();
    const reloadEndpointData = useCallback(async () => {
        setEndpointData(undefined);
        let newEndpointData;
        try {
            newEndpointData = await getEndpointData();
        } catch(e) {
            if(!isMounted.current) return;
            if(handleError) {
                await handleError(e);
                return;
            }
            else throw e;
        }
        if(isMounted.current) setEndpointData(newEndpointData);
    }, [getEndpointData, handleError, isMounted]);

    useEffect(() => { reloadEndpointData(); }, [reloadEndpointData]);

    return [endpointData, !endpointData, reloadEndpointData];
}

export default useEndpointData;
