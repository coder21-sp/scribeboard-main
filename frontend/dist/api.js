// Access tokens stay in memory; the API keeps refresh tokens in HttpOnly cookies.
export class ApiClient {
  constructor(base, fetcher = globalThis.fetch.bind(globalThis)) { this.base = base.replace(/\/$/, ''); this.fetcher = fetcher; this.session = null; this.refreshing = null; }
  async refreshSession() {
    if (!this.refreshing) {
      const refresh = async () => {
        const r = await this.request('/auth/refresh-tokens', { method: 'POST', body: {}, retry: false });
        this.session = { ...this.session, ...r.data };
      };
      // Serialize refresh-cookie rotation across tabs on browsers with Web Locks.
      this.refreshing = (globalThis.navigator?.locks ? navigator.locks.request('scribe-refresh:' + this.base, refresh) : refresh())
        .catch(e => { if (e.status === 401 || e.status === 403) this.session = null; throw e; })
        .finally(() => { this.refreshing = null; });
    }
    return this.refreshing;
  }
  async restoreSession() {
    try {
      await this.refreshSession();
      const profile = await this.request('/auth/profile');
      this.session.user = profile.data;
      return true;
    } catch (e) {
      if (e.status === 401 || e.status === 403) { this.session = null; return false; }
      throw e;
    }
  }
  async request(path, { method = 'GET', body, retry = true } = {}) {
    let res;
    try { res = await this.fetcher(this.base + path, { method, credentials: 'include', headers: { ...(path.startsWith('/auth/') ? { 'X-Scribe-Session': 'cookie' } : {}), ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}), ...(this.session?.accessToken ? { Authorization: `Bearer ${this.session.accessToken}` } : {}) }, ...(body !== undefined ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(method === 'GET' || path === '/auth/refresh-tokens' ? 90000 : 30000) }); }
    catch { throw new Error('Cannot reach your API. Check the API address, HTTPS, and backend CORS settings.'); }
    if (res.status === 401 && retry && this.session && path !== '/auth/refresh-tokens' && path !== '/auth/login' && path !== '/auth/register' && path !== '/auth/logout') {
      await this.refreshSession();
      return this.request(path, { method, body, retry: false });
    }
    let data; try { data = await res.json(); } catch { throw new Error('The API did not return JSON. Check that the address ends with /api/v1.'); }
    if (!res.ok || data.success === false) { const error = new Error(data.message || `Request failed (${res.status})`); error.status = res.status; throw error; }
    return data;
  }
}
export function validBase(value) {
  const url = new URL(value);
  if (url.username || url.password || url.search || url.hash) throw new Error('Use an API address without credentials, query parameters, or a fragment.');
  if (url.protocol !== 'https:' && !(url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname))) throw new Error('Use HTTPS, or HTTP on localhost for local development.');
  return url.href.replace(/\/$/, '');
}
