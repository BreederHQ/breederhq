export function makeApi(base = (window as any).__BHQ_API_BASE__ || "") {
  async function j<T>(r: Response): Promise<T> {
    const t = await r.text(); try { return JSON.parse(t) } catch { return t as any }
  }
  return {
    organizations: {
      async list(params: { q?: string; page?: number; limit?: number } = {}) {
        const qs = new URLSearchParams(params as any).toString();
        const r = await fetch(`${base}/api/v1/organizations${qs ? `?${qs}` : ""}`, { credentials: "include" });
        const data = await j<any>(r); if (!r.ok) throw data;
        const items = Array.isArray(data?.items) ? data.items : (Array.isArray(data?.data) ? data.data : []);
        return { items };
      },
      async get(id: number) {
        const r = await fetch(`${base}/api/v1/organizations/${id}`, { credentials: "include" });
        const data = await j<any>(r); if (!r.ok) throw data; return data;
      },
      async update(id: number, patch: { name: string }) {
        const r = await fetch(`${base}/api/v1/organizations/${id}`, {
          method: "PATCH", credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(patch),
        });
        const data = await j<any>(r); if (!r.ok) throw data; return data;
      },
    },
  };
}
