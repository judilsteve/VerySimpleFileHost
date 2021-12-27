import { usePageTitle } from "../../Hooks/usePageTitle";

function Unauthorised() {
    usePageTitle('Unauthorised');

    return <>TODO_JU 403 page</>; // TODO_JU I don't like having error pages as redirects
}

export default Unauthorised;