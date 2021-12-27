import { useCallback, useEffect, useState } from 'react';

export class SharedState<T> {
    private readonly watchers: ((v: T) => void)[] = [];

    constructor(public value: T) {}

    watch(watcher: (v: T) => void) {
        this.watchers.push(watcher);
        return this.watchers.length - 1;
    }

    removeWatcher(index: number) {
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
    }
}

export function useSharedState<T>(sharedState: SharedState<T>): [T, (newValue: T) => void] {
    const [value, setValue] = useState(sharedState.value);
    useEffect(() => {
        const watcherIndex = sharedState.watch(setValue);
        return () => sharedState.removeWatcher(watcherIndex);
    }, [sharedState]);
    return [value, useCallback((newValue: T) => sharedState.setValue(newValue), [sharedState])];
}
