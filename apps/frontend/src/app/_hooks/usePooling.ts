import { useEffect, useRef, useCallback } from "react";

interface UsePollingOptions<T> {
    /** Polling interval in milliseconds (default: 1000ms) */
    interval?: number;
    /** Whether polling is enabled (default: true) */
    enabled?: boolean;
    /** Compare function to determine if data has changed (default: JSON.stringify comparison) */
    compareFn?: (prev: T, current: T) => boolean;
}

/**
 * Generic polling hook that executes a function at regular intervals
 * @param fetchFn - Async function that fetches the data
 * @param onUpdate - Callback when data changes
 * @param options - Polling configuration options
 */
export function usePolling<T>(
    fetchFn: () => Promise<T>,
    onUpdate: (data: T) => void,
    options: UsePollingOptions<T> = {}
) {
    const {
        interval = 1000,
        enabled = true,
        compareFn = (prev: T, current: T) => JSON.stringify(prev) === JSON.stringify(current)
    } = options;

    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const isFetchingRef = useRef(false);
    const lastDataRef = useRef<T | undefined>(undefined);

    // Store the latest callback in a ref to avoid recreating executeFetch
    const onUpdateRef = useRef(onUpdate);
    const fetchFnRef = useRef(fetchFn);
    const compareFnRef = useRef(compareFn);
    
    // Update refs when callbacks change
    useEffect(() => {
        onUpdateRef.current = onUpdate;
    }, [onUpdate]);
    
    useEffect(() => {
        fetchFnRef.current = fetchFn;
    }, [fetchFn]);
    
    useEffect(() => {
        compareFnRef.current = compareFn;
    }, [compareFn]);

    const executeFetch = useCallback(async () => {
        if (!enabled || isFetchingRef.current) {
            return;
        }

        isFetchingRef.current = true;
        
        try {
            const newData = await fetchFnRef.current();
            
            // Only update if data has actually changed
            if (lastDataRef.current === undefined || !compareFnRef.current(lastDataRef.current, newData)) {
                lastDataRef.current = newData;
                onUpdateRef.current(newData);
            }
        } catch (error) {
            console.error('Polling fetch failed:', error);
        } finally {
            isFetchingRef.current = false;
        }
    }, [enabled]);

    const startPolling = useCallback(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
        }

        intervalRef.current = setInterval(executeFetch, interval);
        
        // Fetch immediately when starting
        executeFetch();
    }, [executeFetch, interval]);

    const stopPolling = useCallback(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    }, []);

    // Effect to manage polling lifecycle - only depend on enabled and interval
    useEffect(() => {
        if (!enabled) {
            stopPolling();
            return;
        }

        startPolling();
        return stopPolling;
    }, [enabled, interval, executeFetch]); // Remove startPolling and stopPolling from deps

    // Cleanup on unmount
    useEffect(() => {
        return stopPolling;
    }, [stopPolling]);

    return {
        /** Manually trigger a fetch */
        fetchNow: executeFetch,
        /** Stop polling */
        stop: stopPolling,
        /** Start/restart polling */
        start: startPolling,
        /** Check if currently polling */
        isPolling: () => intervalRef.current !== null
    };
}