// frontend/assets/app.js
const __app = (() => {
  const API_BASE = "http://127.0.0.1:8000";
  const TOKEN_KEY = "access_token";
  const USER_KEY = "current_user";

  function getToken() {
    return localStorage.getItem(TOKEN_KEY);
  }

  function setToken(t) {
    localStorage.setItem(TOKEN_KEY, t);
  }

  function clearAuth() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  function getUser() {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  }

  function setUser(u) {
    localStorage.setItem(USER_KEY, JSON.stringify(u));
  }

  // ✅ headers helper (pour fetch direct)
  function authHeaders(extra = {}) {
    const headers = { ...extra };
    const token = getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
    return headers;
  }

  // ✅ helper API : auto Authorization + auto Content-Type si body
  async function api(path, options = {}) {
    const headers = options.headers ? { ...options.headers } : {};
    const token = getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;

    // si on envoie un body JSON et pas de content-type => on le met
    if (options.body && !headers["Content-Type"]) {
      headers["Content-Type"] = "application/json";
    }

    const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
    const text = await res.text();

    if (!res.ok) throw new Error(text || `HTTP ${res.status}`);
    return text ? JSON.parse(text) : null;
  }

  async function login(email, password) {
    const data = await api("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    if (!data?.access_token) throw new Error("Pas de token reçu");
    setToken(data.access_token);

    const me = await api("/api/auth/me");
    setUser(me);

    return data.access_token;
  }

  // ✅ topbar: pseudo + logout si connecté, sinon bouton login
  function renderAuthArea(el) {
    const user = getUser();
    if (user?.email) {
      const pseudo = user.email.split("@")[0];
      el.innerHTML = `
        <span class="badge">👤 ${pseudo}</span>
        <button class="btn btn-ghost" id="btnTopLogout">Se déconnecter</button>
      `;
      el.querySelector("#btnTopLogout").onclick = () => {
        clearAuth();
        window.location.href = "./index.html";
      };
    } else {
      el.innerHTML = `<a class="btn btn-ghost" href="./index.html">🔐 Login</a>`;
    }
  }

  return {
    API_BASE,
    getToken,
    setToken,
    clearAuth,
    getUser,
    setUser,
    authHeaders,
    api,
    login,
    renderAuthArea,
  };
})();
