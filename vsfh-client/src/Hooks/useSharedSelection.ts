import { RefObject, useCallback, useEffect, useRef, useState } from "react";

export interface SelectedPath {
    isDirectory: boolean;
    deselect: (() => void) | null;
}

export type SelectedPaths = { [path: string]: SelectedPath };

/**
 * Are these hooks a terrifyingly fragile footgun of labyrinthine complexity
 * and an abject mockery of the core idioms of react? Absolutely.
 * 
 * Is the improvement in UI responsiveness worth all the hassle?
 * You bet your sweet bippy it is.
 */

export function useSharedSelectionSource() {
    const [selectedPaths, setSelectedPaths] = useState<SelectedPaths>({});
    // Provides child components access to the selected path set
    // without causing them to re-render every time it changes
    const selectedPathsRef = useRef(selectedPaths);
    const selectPath = useCallback((path: string, isDirectory: boolean, deselect: () => void) =>
        setSelectedPaths(paths => {
            const newPaths: SelectedPaths = {};
            const testPath = `${path}/`
            for(const oldPath in paths) {
                // Skip any sub-paths of the path being added,
                // since they will now be captured implicitly by their parent
                if(!oldPath.startsWith(testPath))
                    newPaths[oldPath] = paths[oldPath];
                else {
                    // Call the deselect handler to update the checkbox's local state
                    paths[oldPath].deselect?.();
                }
            }
            newPaths[path] = { isDirectory, deselect };
            selectedPathsRef.current = newPaths;
            return newPaths;
    }), []);
    const deselectPath = useCallback((path: string) => setSelectedPaths(paths => {
        const newPaths: SelectedPaths = {};
        for(const oldPath in paths) {
            if(oldPath !== path)
                newPaths[oldPath] = paths[oldPath];
        }
        paths[path].deselect?.();
        selectedPathsRef.current = newPaths;
        return newPaths;
    }), []);
    const clearPaths = useCallback(() => setSelectedPaths(paths => {
        for(const path of Object.values(paths)) {
            path.deselect?.();
        }
        const newPaths = {};
        selectedPathsRef.current = newPaths;
        return newPaths;
    }), []);

    return {
        selectedPaths,
        selectedPathsRef,
        selectPath,
        deselectPath,
        clearPaths
    };
}

export function useSharedSelection(
    selectPath: (path: string, isDirectory: boolean, deselect: () => void) => void,
    deselectPath: (path: string) => void,
    selectedPaths: RefObject<SelectedPaths>,
    path: string,
    isDirectory: boolean
) {
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

    return { selected, toggleSelect };
}
