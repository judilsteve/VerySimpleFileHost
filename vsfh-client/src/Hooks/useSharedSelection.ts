import { useEffect, useState } from "react";

function useSharedSelection(
    selectPath: (path: string, isDirectory: boolean, deselect: () => void) => void,
    deselectPath: (path: string) => void,
    path: string,
    isDirectory: boolean
): [boolean, () => void] {
    // By managing the selection state within the selected component and using
    // an effect to update the global selection set, we avoid this component having a
    // dependency on the set of selected paths. This means we don't have to re-render
    // every selectable component each time a single component is selected/deselected.
    const [selected, setSelected] = useState(false);

    // Make sure we deselect ourself on dismount
    useEffect(() => {
        return () => deselectPath(path);
    }, [deselectPath, path]);

    const toggleSelect = () => {
        if(selected) {
            setSelected(false);
            deselectPath(path);
        } else {
            setSelected(true);
            selectPath(path, isDirectory, () => setSelected(false));
        }
    };

    return [selected, toggleSelect];
}

export default useSharedSelection;
