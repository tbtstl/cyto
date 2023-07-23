import { Ref, useEffect, useRef } from "react";

const useAsyncEffect = (effect: (ref: Ref<boolean>) => void, dependencies: any[]) => {
    const mountedRef = useRef(true);

    useEffect(() => {
        return () => {
            mountedRef.current = false;
        };
    }, []);

    useEffect(() => {
        const asyncEffect = async () => {
            await effect(mountedRef);
        };

        asyncEffect();

        // Only re-run the effect if dependencies change
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, dependencies);
};
