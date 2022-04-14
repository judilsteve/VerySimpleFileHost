// Safely access window in preact's pre-render environment (by returning null if window is not available)
const safeWindow = typeof window === 'undefined' ? null : window;

export function getSearchParam(key: string) {
    const search = safeWindow?.location?.search;
    if(search) return new URLSearchParams(search).get(key);
    else return null;
}

export default safeWindow;
