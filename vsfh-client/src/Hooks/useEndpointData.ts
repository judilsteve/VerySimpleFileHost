import { useEffect, useState } from "react";

function useEndpointData<T>(
    getEndpointData: () => Promise<T>,
    handleError?: (error: any) => void)
    : [T | undefined, boolean] {

    const [endpointData, setEndpointData] = useState<T | undefined>(undefined);

    useEffect(() => {
        setEndpointData(undefined);
        let cancel = false;
        (async () => {
            let newEndpointData;
            try {
                newEndpointData = await getEndpointData();
            } catch(e) {
                if(handleError) {
                    handleError(e);
                    return;
                }
                else throw e;
            }
            if(!cancel) setEndpointData(newEndpointData);
        })();
        return () => { cancel = true; }
    }, [getEndpointData, handleError]);

    return [endpointData, !endpointData];
}

export default useEndpointData;
