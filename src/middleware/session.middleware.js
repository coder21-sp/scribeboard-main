const jwt = require('jsonwebtoken');
const config = require('../config');
const AppError = require('../utils/AppError');
const cookieName = 'scribe_refresh';
const cookieOptions = () => ({ httpOnly: true, secure: config.env === 'production', sameSite: config.env === 'production' ? 'none' : 'lax', partitioned: config.env === 'production', path: config.api.prefix + '/auth' });
// Browser cookie sessions require an exact allowed Origin and a non-simple header.
// Legacy non-browser clients can keep passing refreshToken explicitly in JSON.
function browserSession(req, res, next) {
  req.cookieSession = req.get('X-Scribe-Session') === 'cookie';
  if (!req.cookieSession) return next();
  if (!config.cors.origin || config.cors.origin === '*' || req.get('Origin') !== config.cors.origin) return next(AppError.forbidden('Browser session origin is not allowed'));
  res.set('Cache-Control', 'no-store');
  next();
}
function readRefreshCookie(req, res, next) {
  if (!req.cookieSession) return next();
  const entry = (req.headers.cookie || '').split(';').map(v => v.trim()).find(v => v.startsWith(cookieName + '='));
  let value;
  try { value = entry ? decodeURIComponent(entry.slice(cookieName.length + 1)) : ''; } catch { value = ''; }
  if (!value) return next(AppError.unauthorized('No browser session'));
  req.body = { refreshToken: value };
  next();
}
function sessionResponse(req, res, result) {
  res.set('Cache-Control', 'no-store');
  if (!req.cookieSession) return result;
  const { refreshToken, ...data } = result;
  const expires = new Date(jwt.decode(refreshToken).exp * 1000);
  res.cookie(cookieName, refreshToken, { ...cookieOptions(), expires });
  return data;
}
function clearSessionCookie(res) { res.clearCookie(cookieName, cookieOptions()); }
module.exports = { browserSession, readRefreshCookie, sessionResponse, clearSessionCookie };
