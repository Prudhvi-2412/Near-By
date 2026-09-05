type Listener = () => void;

let accessToken: string | null = null;
let roles: string[] = [];
const listeners = new Set<Listener>();

const EMPTY_ROLES: string[] = [];

export const tokenStore = {
  get: () => accessToken,
  getRoles: () => roles,
  hasToken: () => accessToken !== null,
  set(token: string | null, nextRoles: string[] = []) {
    accessToken = token;
    roles = nextRoles;
    listeners.forEach((l) => l());
  },
  clear() {
    accessToken = null;
    roles = [];
    listeners.forEach((l) => l());
  },
  subscribe(listener: Listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  // Stable references for useSyncExternalStore's getServerSnapshot — must
  // never change identity across renders, or React logs a hydration warning.
  getServerRoles: () => EMPTY_ROLES,
  getServerHasToken: () => false,
};
