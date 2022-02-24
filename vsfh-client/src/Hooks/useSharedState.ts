import { useCallback, useEffect, useState } from 'react';

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
    constructor(localStorageKey: string, initialValue: T) {
        const persistedJson = window.localStorage.getItem(localStorageKey);
        const persistedData = persistedJson === null ? initialValue : JSON.parse(persistedJson);
        super(persistedData);
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
        window.onstorage = () => {
            const newValue = window.localStorage.getItem(localStorageKey);
            this.setValue(newValue ? JSON.parse(newValue) : newValue);
        }
    }
}

export function useSharedState<T>(sharedState: SharedState<T>): [T, (newValue: T) => void] {
    const [value, setValue] = useState(sharedState.value);
    useEffect(() => {
        sharedState.watch(setValue);
        return () => sharedState.removeWatcher(setValue);
    }, [sharedState]);
    return [value, useCallback((newValue: T) => sharedState.setValue(newValue), [sharedState])];
}
