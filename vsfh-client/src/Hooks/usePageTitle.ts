import { useEffect } from "react";

// TODO_JU Should be able to set this statically now
export function usePageTitle(subtitle: string) {
    useEffect(() => {
        document.title = `${subtitle} - VSFH`;
    }, [subtitle]);
}
