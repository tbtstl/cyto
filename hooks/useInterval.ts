import { useEffect, useRef } from "react";

export function useInterval(callback: () => void, delay: number | null) {
    const savedCallback = useRef<() => void | undefined>();

    // Remember the latest callback if it changes
    useEffect(() => {
        savedCallback.current = callback;
    }, [callback]);

    // Set up the interval
    useEffect(() => {
        function tick() {
            if (savedCallback.current) {
                savedCallback.current();
            }
        }

        if (delay !== null) {
            const id = setInterval(tick, delay);

            // Clean up the interval on unmount
            return () => clearInterval(id);
        }
    }, [delay]);
}
