import { RefObject, useEffect, useState } from "react";

export interface SelectedPath {
    isDirectory: boolean;
    deselect: (() => void) | null;
}

export type SelectedPaths = { [path: string]: SelectedPath };

function useSharedSelection(
    selectPath: (path: string, isDirectory: boolean, deselect: () => void) => void,
    deselectPath: (path: string) => void,
    selectedPaths: RefObject<SelectedPaths>,
    path: string,
    isDirectory: boolean
): [boolean, () => void] {
    // By managing the selection state within the selected component and using
    // an effect to update the global selection set, we avoid this component having a
    // dependency on the set of selected paths. This means we don't have to re-render
    // every selectable component each time a single component is selected/deselected.
    const [selected, setSelected] = useState(false);

    // Use the ref object to restore the correct checkbox state when the component remounts
    // e.g. after being filtered/collapsed and then unfiltered/reopened
    useEffect(() => {
        const selectedPathInfo = selectedPaths.current![path];
        if(!selectedPathInfo) return;
        setSelected(true);
        // Update the deselect handle in the map of selectedPaths
        selectedPathInfo.isDirectory = isDirectory;
        selectedPathInfo.deselect = () => setSelected(false);
        return () => { selectedPathInfo.deselect = null; };
    }, [selectedPaths, path, isDirectory]);

    const toggleSelect = () => {
        if(selected) {
            deselectPath(path);
        } else {
            setSelected(true);
            selectPath(path, isDirectory, () => setSelected(false));
        }
    };

    return [selected, toggleSelect];
}

export default useSharedSelection;
