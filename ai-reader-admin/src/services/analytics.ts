import { adminApi } from './api';

export async function trackAdminEvent(
  event: string,
  properties?: Record<string, unknown>,
) {
  const adminRaw = localStorage.getItem('admin_user');
  const admin = adminRaw ? JSON.parse(adminRaw) as { username?: string } : null;
  const distinctId = admin?.username || 'anonymous-admin';

  try {
    await adminApi.captureEvent({
      event,
      distinctId,
      source: 'admin_console',
      properties,
    });
  } catch {
    // 埋点失败不阻断管理操作
  }
}
