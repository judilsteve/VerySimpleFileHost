import { useRouter } from "next/router";
import { useState, useEffect } from "react";

// TODO_JU Test this
function useLocation() {
    const router = useRouter();
    const [location, setLocation] = useState({
        pathname: router.pathname,
        search: typeof window === 'undefined' ? '' : window.location.search,
        hash: typeof window === 'undefined' ? '' : window.location.hash
    });
    useEffect(() => {
        setLocation({
            pathname: router.pathname,
            search: window.location.search,
            hash: window.location.hash
        });
    }, [router.pathname]);
    return location;
}

export default useLocation;