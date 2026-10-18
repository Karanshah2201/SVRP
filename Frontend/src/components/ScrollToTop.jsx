import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

export default function ScrollToTop() {
    const { pathname } = useLocation();
    const isFirstRun = useRef(true);

    useEffect(() => {
        // Skip scroll to top on initial mount (refresh) to let browser restore scroll position
        if (isFirstRun.current) {
            isFirstRun.current = false;
            return;
        }
        window.scrollTo(0, 0);
    }, [pathname]);

    return null;
}
