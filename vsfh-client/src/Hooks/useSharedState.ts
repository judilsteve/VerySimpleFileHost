import { useCallback, useEffect, useState } from 'preact/hooks';
import safeWindow from '../Utils/safeWindow';

export class SharedState<T> {
    private readonly watchers: ((v: T) => void)[] = [];

    constructor(public value: T) {}

    watch(watcher: (v: T) => void) {
        this.watchers.push(watcher);
    }

    removeWatcher(watcher: (v: T) => void) {
        const index = this.watchers.indexOf(watcher);
        this.watchers.splice(index, 1);
    }

    setValue(newValue: T) {
        this.value = newValue;
        for(const watcher of this.watchers) {
            watcher(newValue);
        }
    }
}

export class SharedPersistedState<T> extends SharedState<T> {
    constructor(private localStorageKey: string, private initialValue: T) {
        super(initialValue);
        // https://developer.mozilla.org/en-US/docs/Web/API/Storage/setItem#exceptions
        this.watch(s => {
            try {
                window.localStorage.setItem(localStorageKey, JSON.stringify(s));
            } catch(e) {
                console.error('Saving to local storage failed:');
                console.error(e);
            }
        });
        // Handle local storage updates from other tabs. Mozilla states that this event only fires if the update
        // comes from another tab: https://developer.mozilla.org/en-US/docs/Web/API/Window/storage_event
        if(safeWindow) window.onstorage = e => {
            if(e.storageArea !== window.localStorage || e.key !== localStorageKey) return;
            this.setValue(e.newValue === null ? e.newValue : JSON.parse(e.newValue));
        }
    }

    public loadFromLocalStorage() {
        const persistedJson = window.localStorage.getItem(this.localStorageKey) ?? null;
        this.setValue(persistedJson === null ? this.initialValue : (JSON.parse(persistedJson) as T));
    }
}

export function useSharedState<T>(sharedState: SharedState<T>): [T, (newValue: T) => void] {
    const [value, setValue] = useState(sharedState.value);
    useEffect(() => {
        sharedState.watch(setValue);
        if(sharedState instanceof SharedPersistedState) {
            // Restore value from local storage (it would not have been available during pre-rendering)
            // Must do this *after* setting up our watcher or else the "local" state value will not be set
            sharedState.loadFromLocalStorage();
        }
        return () => sharedState.removeWatcher(setValue);
    }, [sharedState]);
    return [value, useCallback((newValue: T) => sharedState.setValue(newValue), [sharedState])];
}
