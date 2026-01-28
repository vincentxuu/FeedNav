// Polyfill for Node.js 22+ experimental localStorage
// Node.js 22+ has an experimental localStorage that is not compatible with Web Storage API
// This causes issues with libraries like Supabase that use globalThis.localStorage
export async function register() {
  if (typeof window === 'undefined') {
    // Server-side: polyfill globalThis.localStorage with a no-op implementation
    const noopStorage = {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
      clear: () => {},
      key: () => null,
      length: 0,
    };

    // Only polyfill if localStorage exists but is incompatible
    if (
      typeof globalThis.localStorage !== 'undefined' &&
      typeof globalThis.localStorage.getItem !== 'function'
    ) {
      (globalThis as unknown as { localStorage: typeof noopStorage }).localStorage = noopStorage;
    }
  }
}
