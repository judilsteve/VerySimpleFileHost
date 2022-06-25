import { useEffect } from "preact/hooks";

export function usePageTitle(subtitle: string) {
    useEffect(() => {
        document.title = `${subtitle} - VSFH`;
    }, [subtitle]);
}
