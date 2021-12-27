import { usePageTitle } from "../../Hooks/usePageTitle";

function ServerError() {
    usePageTitle('Server Error');

    return <>TODO_JU 500 page</>; // TODO_JU I don't like having error pages as redirects
}

export default ServerError;