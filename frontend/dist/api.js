// Tokens stay in memory. Reloading the page requires signing in again.
export class ApiClient {
  constructor(base, fetcher = globalThis.fetch.bind(globalThis)) { this.base = base.replace(/\/$/, ''); this.fetcher = fetcher; this.session = null; this.refreshing = null; }
  async request(path, { method = 'GET', body, retry = true } = {}) {
    let res;
    try { res = await this.fetcher(this.base + path, { method, headers: { ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}), ...(this.session?.accessToken ? { Authorization: `Bearer ${this.session.accessToken}` } : {}) }, ...(body !== undefined ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(method === 'GET' ? 90000 : 30000) }); }
    catch { throw new Error('Cannot reach your API. Check the API address, HTTPS, and backend CORS settings.'); }
    if (res.status === 401 && retry && this.session?.refreshToken && !path.startsWith('/auth/')) {
      if (!this.refreshing) this.refreshing = this.request('/auth/refresh-tokens', { method: 'POST', body: { refreshToken: this.session.refreshToken }, retry: false }).then(r => { this.session = { ...this.session, ...r.data }; }).catch(e => { this.session = null; throw e; }).finally(() => { this.refreshing = null; });
      await this.refreshing;
      return this.request(path, { method, body, retry: false });
    }
    let data; try { data = await res.json(); } catch { throw new Error('The API did not return JSON. Check that the address ends with /api/v1.'); }
    if (!res.ok || data.success === false) throw new Error(data.message || `Request failed (${res.status})`);
    return data;
  }
}
export function validBase(value) {
  const url = new URL(value);
  if (url.username || url.password || url.search || url.hash) throw new Error('Use an API address without credentials, query parameters, or a fragment.');
  if (url.protocol !== 'https:' && !(url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname))) throw new Error('Use HTTPS, or HTTP on localhost for local development.');
  return url.href.replace(/\/$/, '');
}
