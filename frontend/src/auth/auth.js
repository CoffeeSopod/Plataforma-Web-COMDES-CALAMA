const KEY_TOKEN = 'token';
const KEY_USER  = 'user';

export function getToken() {
  return localStorage.getItem(KEY_TOKEN);
}
export function getUser() {
  try { return JSON.parse(localStorage.getItem(KEY_USER) || 'null'); }
  catch { return null; }
}
export function login({ token, user }) {
  localStorage.setItem(KEY_TOKEN, token);
  localStorage.setItem(KEY_USER, JSON.stringify(user));
}
export function logout() {
  localStorage.removeItem(KEY_TOKEN);
  localStorage.removeItem(KEY_USER);
}
export function isAuthenticated() {
  return Boolean(getToken());
}
