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
    // TODO_JU This is causing nodes to be deselected when they are dismounted by
    // the text filter. It would be convenient if this only happened when the folder
    // was collapsed (or maybe not even then), but it would make it difficult to enable
    // the checkbox again when the node becomes visible again.
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
