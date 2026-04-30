import { useUserStore } from "../store/user";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") || "/api";
const SESSION_KEY = "ai_reader_visitor_id";

function getVisitorId() {
  const existing = localStorage.getItem(SESSION_KEY);
  if (existing) {
    return existing;
  }

  const next = `visitor_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  localStorage.setItem(SESSION_KEY, next);
  return next;
}

function getDistinctId() {
  const userId = useUserStore.getState().userInfo?.id;
  return userId || getVisitorId();
}

export async function trackWebEvent(
  event: string,
  properties?: Record<string, unknown>,
) {
  try {
    await fetch(`${API_BASE_URL}/analytics/capture`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        event,
        distinctId: getDistinctId(),
        source: "web_app",
        properties,
      }),
      keepalive: true,
    });
  } catch {
    // 埋点失败不影响用户浏览
  }
}
