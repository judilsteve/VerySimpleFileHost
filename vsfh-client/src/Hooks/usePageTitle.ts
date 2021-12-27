import { useEffect } from "react";

export function usePageTitle(subtitle: string) {
    useEffect(() => {
        document.title = `${subtitle} - Very Simple File Host`;
    }, [subtitle]);
}
