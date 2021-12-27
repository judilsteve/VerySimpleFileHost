import NavHeader from "../Components/NavHeader";
import { usePageTitle } from "../Hooks/usePageTitle";

function Browse() {
    usePageTitle('Browse');

    // TODO_JU
    // Text filter
    // Toggle for archive download format
    // Hash parsing
    // Navigation and Log Out

    return <div style={{ marginLeft: "1em", marginRight: "1em" }}>
        <NavHeader pageTitle="Browse" />
    </div>;
}

export default Browse;
