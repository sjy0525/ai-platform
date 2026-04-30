import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { trackWebEvent } from "../services/analytics";

const AnalyticsTracker = () => {
  const location = useLocation();
  const currentRef = useRef<{ path: string; startedAt: number } | null>(null);

  useEffect(() => {
    const nextPath = `${location.pathname}${location.search}`;
    const now = Date.now();
    const previous = currentRef.current;

    if (previous) {
      void trackWebEvent("page_leave", {
        path: previous.path,
        durationMs: now - previous.startedAt,
      });
    }

    currentRef.current = {
      path: nextPath,
      startedAt: now,
    };

    void trackWebEvent("page_view", {
      path: nextPath,
      title: document.title || nextPath,
    });
  }, [location.pathname, location.search]);

  useEffect(() => {
    const flush = () => {
      const current = currentRef.current;
      if (!current) {
        return;
      }

      void trackWebEvent("page_leave", {
        path: current.path,
        durationMs: Date.now() - current.startedAt,
      });
    };

    window.addEventListener("beforeunload", flush);
    return () => {
      window.removeEventListener("beforeunload", flush);
    };
  }, []);

  return null;
};

export default AnalyticsTracker;
