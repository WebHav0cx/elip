// Mock-only adapter boundary. Replace these methods with /api/v1 clients when FastAPI is available.
export const mockApi = {
  mode: "MOCK_DATA" as const,
  async respond<T>(data: T): Promise<{ data: T; lastSyncedAt: string }> {
    await new Promise((resolve) => window.setTimeout(resolve, 180));
    return { data, lastSyncedAt: "2026-12-03T09:32:18+01:00" };
  },
};
