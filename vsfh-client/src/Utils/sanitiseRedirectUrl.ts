export default function sanitiseRedirectUrl(redirect: string) {
    // Sanitise to prevent open redirect attack
    const redirectUrl = new URL(redirect, window.origin);
    return `${redirectUrl.pathname}${redirectUrl.search}`;
}
