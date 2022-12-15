import safeWindow from "./safeWindow";

export default function sanitiseRedirectUrl(redirect: string) {
    if(!safeWindow || !redirect) return '';
    // Sanitise to prevent open redirect attack
    const redirectUrl = new URL(redirect, safeWindow.origin);
    return `${redirectUrl.pathname}${redirectUrl.search}`;
}
