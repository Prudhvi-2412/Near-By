const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

/** Server-side fetch helper that never throws — public pages should render gracefully if the API is briefly unreachable. */
export async function serverGet<T>(path: string, fallback: T): Promise<T> {
  try {
    const res = await fetch(`${API_URL}/api/v1${path}`, { cache: 'no-store' });
    if (!res.ok) return fallback;
    return (await res.json()) as T;
  } catch {
    return fallback;
  }
}
