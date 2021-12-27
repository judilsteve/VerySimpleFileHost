import { usePageTitle } from "../../Hooks/usePageTitle";

function NotFound() {
    usePageTitle('Not Found');

    return <>TODO_JU 404 page</>; // TODO_JU I don't like having error pages as redirects
}

export default NotFound;