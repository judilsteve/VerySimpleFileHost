// Safely access window in preact's pre-render environment (by returning null if window is not available)
const safeWindow = typeof window === 'undefined' ? null : window;

export default safeWindow;
