const API_URL = "http://localhost:3000/api";

// ================= AUTH HELPERS =================
function getAuthHeader() {
  const token = sessionStorage.getItem('authToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ================= LOGIN =================
async function login(username, password) {
  try {
    const response = await fetch('http://localhost:3000/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const data = await response.json();

    if (response.ok) {
      // Save token in memory (or sessionStorage for page refresh)
      sessionStorage.setItem('authToken', data.token);
      showDashboard(data.user);
    } else {
      alert('Login failed: ' + data.error);
    }
  } catch (err) {
    alert('Network error');
  }
}

// ================= ADMIN DASHBOARD =================
async function loadAdminDashboard() {
  const res = await fetch('http://localhost:3000/api/admin/dashboard', {
    headers: getAuthHeader()
  });

  if (res.ok) {
    const data = await res.json();
    document.getElementById('content').innerText = data.message;
  } else {
    document.getElementById('content').innerText = 'Access denied!';
  }
}

// ================= UI HELPERS =================
function showDashboard(user) {
  // Update UI and navigate
  updateNavbar(user);
  location.hash = "#/profile";
}

function updateNavbar(user = null) {
  const navLoggedOut = document.querySelector(".nav-logged-out");
  const navLoggedIn = document.querySelector(".nav-logged-in");
  const navEmail = document.getElementById("nav-email");

  if (user) {
    navLoggedOut?.classList.add("d-none");
    navLoggedIn?.classList.remove("d-none");
    if (navEmail) navEmail.innerText = user.username;
    document.body.classList.remove("not-authenticated");
    document.body.classList.add("authenticated");
    handleRoleUI(user.role);
  } else {
    navLoggedOut?.classList.remove("d-none");
    navLoggedIn?.classList.add("d-none");
    document.body.classList.add("not-authenticated");
    document.body.classList.remove("authenticated");
    handleRoleUI(null);
  }
}

function handleRoleUI(role) {
  const adminSection = document.getElementById("admin-section");
  if (!adminSection) return;

  if (role === "admin") {
    adminSection.style.display = "block";
  } else {
    adminSection.style.display = "none";
  }
}

// ================= NAVIGATION =================
const pages = document.querySelectorAll(".page");

function showPage(pageId) {
  pages.forEach(p => p.classList.remove("active"));
  document.getElementById(pageId)?.classList.add("active");
}

window.addEventListener("hashchange", () => {
  const route = location.hash.replace("#/", "") || "home-page";

  if (route === "login") showPage("login-page");
  else if (route === "register") showPage("register-page");
  else if (route === "profile") {
    showPage("profile-page");
    loadProfile();
  }
  else showPage("home-page");
});

// ================= REGISTER =================
document.getElementById("register-form")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("reg-email").value;
  const password = document.getElementById("reg-password").value;

  try {
    const res = await fetch(`${API_URL}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: email, password })
    });
    const data = await res.json();
    document.getElementById("register-message").innerText = data.message || "Registered!";
    if (res.ok) location.hash = "#/login";
  } catch (err) {
    document.getElementById("register-message").innerText = "Error registering";
  }
});

// ================= LOGIN FORM =================
document.getElementById("login-form")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("login-email").value;
  const password = document.getElementById("login-password").value;
  await login(email, password);
});

// ================= LOAD PROFILE =================
async function loadProfile() {
  const token = sessionStorage.getItem("authToken");
  if (!token) {
    location.hash = "#/login";
    return;
  }

  try {
    const res = await fetch(`${API_URL}/profile`, {
      headers: getAuthHeader()
    });

    if (!res.ok) {
      sessionStorage.removeItem("authToken");
      updateNavbar(null);
      location.hash = "#/login";
      return;
    }

    const data = await res.json();
    const user = data.user;
    updateNavbar(user);
    document.getElementById("profile-name").innerText = user.username;
    document.getElementById("profile-email").innerText = user.username;
    document.getElementById("profile-role").innerText = user.role;
    if (user.role === "admin") loadAdminDashboard();
  } catch (err) {
    location.hash = "#/login";
  }
}

// ================= LOGOUT =================
document.getElementById("logout-btn")?.addEventListener("click", () => {
  sessionStorage.removeItem("authToken");
  updateNavbar(null);
  location.hash = "#/login";
});

// ================= INIT =================
window.onload = () => {
  const token = sessionStorage.getItem("authToken");
  if (token) {
    loadProfile();
  } else {
    updateNavbar(null);
  }
  window.dispatchEvent(new Event("hashchange"));
};
