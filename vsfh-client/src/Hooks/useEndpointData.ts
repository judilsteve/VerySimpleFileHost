import { useEffect, useState } from "react";

function useEndpointData<T>(
    getEndpointData: () => Promise<T>,
    handleError?: (error: any) => void)
    : [T | undefined, boolean] {

    const [endpointData, setEndpointData] = useState<T | undefined>(undefined);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setLoading(true);
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
            } finally {
                if(!cancel) setLoading(false);
            }
            if(!cancel) setEndpointData(newEndpointData);
        })();
        return () => { cancel = true; }
    }, [getEndpointData, handleError]);

    return [endpointData, loading];
}

export default useEndpointData;
