export class AdminApiError extends Error {
  constructor(message: string, public status?: number, public code?: number) {
    super(message);
    this.name = "AdminApiError";
  }
}

type BackendResponse<T> = {
  code: number;
  message: string;
  data?: T;
};

export async function apiRequest<T>(endpoint: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(endpoint, {
    ...init,
    credentials: "include",
    headers: {
      ...(init.headers || {}),
    },
  });

  const payload = (await response.json().catch(() => ({ message: "Request failed" }))) as BackendResponse<T>;
  if (!response.ok || payload.code !== 0) {
    throw new AdminApiError(payload.message || `HTTP ${response.status}`, response.status, payload.code);
  }
  return payload.data as T;
}
