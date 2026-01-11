// frontend/assets/calendar.js
console.log("CALENDAR.JS LOADED");

// ==============================
// INIT
// ==============================
const authArea = document.getElementById("authArea");
if (authArea) __app.renderAuthArea(authArea);

const token = __app.getToken();
const isLogged = !!token;

// ==============================
// ADMIN DETECTION
// ==============================
const adminUserCard = document.getElementById("adminUserCard");
const btnGoUsersTop = document.getElementById("btnGoUsersTop");

let isAdmin = false;

(async () => {
  if (isLogged) {
    try {
      const res = await fetch(__app.API_BASE + "/api/admin/users", {
        headers: __app.authHeaders(),
      });
      isAdmin = res.ok;
    } catch {
      isAdmin = false;
    }
  }

  if (adminUserCard) adminUserCard.style.display = isAdmin ? "block" : "none";

  if (btnGoUsersTop) {
    btnGoUsersTop.style.display = isAdmin ? "inline-flex" : "none";
    btnGoUsersTop.onclick = () => (window.location.href = "./users.html");
  }
})();

// ==============================
// CREATE USER (ADMIN)
// ==============================
const btnCreateUser = document.getElementById("btnCreateUser");
const newEmail = document.getElementById("newEmail");
const newPassword = document.getElementById("newPassword");
const createUserState = document.getElementById("createUserState");

function userMsg(text) {
  if (!createUserState) return;
  createUserState.style.display = "inline-flex";
  createUserState.textContent = text;
}

if (btnCreateUser) {
  btnCreateUser.onclick = async () => {
    if (!token) return userMsg("❌ Connecte-toi");
    if (!isAdmin) return userMsg("⛔ Admin seulement");

    const email = newEmail.value.trim();
    const password = newPassword.value;
    if (!email || !password) return userMsg("❌ Champs requis");

    try {
      await __app.api("/api/admin/users", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      userMsg("✅ Utilisateur créé");
      newEmail.value = "";
      newPassword.value = "";
    } catch (e) {
      userMsg("❌ " + e.message);
    }
  };
}

// ==============================
// MODAL EVENT
// ==============================
const backdrop = document.getElementById("eventModalBackdrop");
const btnClose = document.getElementById("btnCloseModal");
const btnCancel = document.getElementById("btnCancelEvent");
const btnSave = document.getElementById("btnSaveEvent");

const evTitle = document.getElementById("evTitle");
const evCategory = document.getElementById("evCategory");
const evStart = document.getElementById("evStart");
const evEnd = document.getElementById("evEnd");

let pendingRange = null;

function toLocal(date) {
  const d = new Date(date);
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(
    d.getHours()
  )}:${p(d.getMinutes())}`;
}

function openModal(start, end) {
  pendingRange = { start, end };
  evTitle.value = "";
  evCategory.value = "";
  evStart.value = toLocal(start);
  evEnd.value = toLocal(end || start);
  backdrop.style.display = "flex";
}

function closeModal() {
  backdrop.style.display = "none";
  pendingRange = null;
}

if (btnClose) btnClose.onclick = closeModal;
if (btnCancel) btnCancel.onclick = closeModal;

// ==============================
// FULLCALENDAR
// ==============================
const calendarEl = document.getElementById("calendar");
if (!calendarEl) {
  console.error("❌ #calendar introuvable");
} else {
  const calendar = new FullCalendar.Calendar(calendarEl, {
    locale: "fr",
    initialView: "dayGridMonth",
    selectable: true,

    headerToolbar: {
      left: "prev,next today",
      center: "title",
      right: "dayGridMonth,timeGridWeek,timeGridDay",
    },

    events: async (info, success, failure) => {
      try {
        const res = await fetch(__app.API_BASE + "/api/calendar/events", {
          headers: __app.authHeaders(),
        });
        success(await res.json());
      } catch (e) {
        failure(e);
      }
    },

    dateClick(info) {
      if (!token) return alert("Connecte-toi");
      const start = info.date;
      const end = new Date(start.getTime() + 60 * 60 * 1000);
      openModal(start, end);
    },

    eventClick(info) {
      if (!confirm("Supprimer cet événement ?")) return;
      const id = info.event.id;
      info.event.remove();
      if (id)
        __app.api(`/api/calendar/events/${id}`, { method: "DELETE" });
    },
  });

  calendar.render();

  // ==============================
  // SAVE EVENT
  // ==============================
  if (btnSave) {
    btnSave.onclick = async () => {
      if (!pendingRange) return;

      const title = evTitle.value.trim();
      if (!title) return alert("Titre requis");

      await __app.api("/api/calendar/events", {
        method: "POST",
        body: JSON.stringify({
          title,
          category: evCategory.value || null,
          start_at: new Date(evStart.value).toISOString(),
          end_at: new Date(evEnd.value).toISOString(),
          all_day: false,
        }),
      });

      closeModal();
      calendar.refetchEvents();
    };
  }
}
