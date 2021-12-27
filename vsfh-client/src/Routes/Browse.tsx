import { usePageTitle } from "../Hooks/usePageTitle";
import AuthenticatedRoute from "../Routing/AuthenticatedRoute";

function Browse() {
    usePageTitle('Browse');

    return <AuthenticatedRoute>TODO_JU File Browser page</AuthenticatedRoute>;
}

export default Browse;
