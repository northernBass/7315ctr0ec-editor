async function apiFetch(path: string, options?: RequestInit): Promise<{ data: any; error: string | null }> {
  try {
    const isGet = !options?.method || options.method === "GET";
    const res = await fetch(path, {
      ...options,
      headers: isGet ? undefined : { "Content-Type": "application/json", ...(options?.headers || {}) },
    });
    const json = await res.json();
    if (!res.ok) return { data: null, error: json.error || "Request failed" };
    return { data: json.data ?? null, error: null };
  } catch {
    return { data: null, error: "Network error" };
  }
}

export const api = {
  manuscripts: {
    list: () =>
      apiFetch("/api/manuscripts"),
    create: (fields: Record<string, unknown>) =>
      apiFetch("/api/manuscripts", { method: "POST", body: JSON.stringify(fields) }),
    update: (id: number, fields: Record<string, unknown>) =>
      apiFetch(`/api/manuscripts/${id}`, { method: "PATCH", body: JSON.stringify(fields) }),
    delete: (id: number) =>
      apiFetch(`/api/manuscripts/${id}`, { method: "DELETE" }),
  },
  chapters: {
    list: (manuscriptId: number, opts?: { activeOnly?: boolean; select?: string }) => {
      const params = new URLSearchParams({ manuscript_id: String(manuscriptId) });
      if (opts?.activeOnly) params.set("active", "true");
      if (opts?.select) params.set("select", opts.select);
      return apiFetch(`/api/chapters?${params}`);
    },
    create: (fields: Record<string, unknown>) =>
      apiFetch("/api/chapters", { method: "POST", body: JSON.stringify(fields) }),
    update: (id: number, fields: Record<string, unknown>) =>
      apiFetch(`/api/chapters/${id}`, { method: "PATCH", body: JSON.stringify(fields) }),
    delete: (id: number) =>
      apiFetch(`/api/chapters/${id}`, { method: "DELETE" }),
  },
  characters: {
    list: (manuscriptId: number) =>
      apiFetch(`/api/characters?manuscript_id=${manuscriptId}`),
    create: (fields: Record<string, unknown>) =>
      apiFetch("/api/characters", { method: "POST", body: JSON.stringify(fields) }),
    update: (id: number, fields: Record<string, unknown>) =>
      apiFetch(`/api/characters/${id}`, { method: "PATCH", body: JSON.stringify(fields) }),
    delete: (id: number) =>
      apiFetch(`/api/characters/${id}`, { method: "DELETE" }),
  },
  wordCountLog: {
    list: (manuscriptId: number) =>
      apiFetch(`/api/word-count-log?manuscript_id=${manuscriptId}`),
    upsert: (entry: Record<string, unknown>) =>
      apiFetch("/api/word-count-log", { method: "PUT", body: JSON.stringify(entry) }),
  },
  chapterTimeline: {
    list: (manuscriptId: number) =>
      apiFetch(`/api/chapter-timeline?manuscript_id=${manuscriptId}`),
    upsert: (entry: Record<string, unknown>) =>
      apiFetch("/api/chapter-timeline", { method: "PUT", body: JSON.stringify(entry) }),
  },
};
