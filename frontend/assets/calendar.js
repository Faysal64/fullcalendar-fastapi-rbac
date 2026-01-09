// frontend/assets/calendar.js
document.addEventListener("DOMContentLoaded", async () => {
  // ✅ render topbar auth
  const authArea = document.getElementById("authArea");
  if (authArea) __app.renderAuthArea(authArea);

  // --------- Admin detection via API ----------
  const token = __app.getToken();
  const isLogged = !!token;

  const adminUserCard = document.getElementById("adminUserCard");
  const btnGoUsersTop = document.getElementById("btnGoUsersTop");

  let isAdmin = false;

  if (isLogged) {
    try {
      // ⚠️ res.ok = admin si ton endpoint GET /api/admin/users est protégé admin
      const res = await fetch(__app.API_BASE + "/api/admin/users", {
        method: "GET",
        headers: __app.authHeaders(),
      });
      isAdmin = res.ok;
    } catch (e) {
      isAdmin = false;
    }
  }

  // Affichage UI admin
  if (adminUserCard) adminUserCard.style.display = isAdmin ? "block" : "none";

  if (btnGoUsersTop) {
    btnGoUsersTop.style.display = isAdmin ? "inline-flex" : "none";
    btnGoUsersTop.onclick = () => (window.location.href = "./users.html");
  }

  // --------- Create user block ----------
  const btnCreateUser = document.getElementById("btnCreateUser");
  const newEmail = document.getElementById("newEmail");
  const newPassword = document.getElementById("newPassword");
  const createUserState = document.getElementById("createUserState");

  function userMsg(ok, text) {
    if (!createUserState) return;
    createUserState.style.display = "inline-flex";
    createUserState.textContent = text;
    createUserState.className = "badge";
  }

  if (btnCreateUser) {
    btnCreateUser.onclick = async () => {
      if (!__app.getToken()) return userMsg(false, "❌ Tu dois être connecté.");
      if (!isAdmin) return userMsg(false, "⛔ Réservé à l'admin.");

      const email = (newEmail?.value || "").trim();
      const password = newPassword?.value || "";
      if (!email || !password) return userMsg(false, "❌ Email + mot de passe requis");

      try {
        await __app.api("/api/admin/users", {
          method: "POST",
          body: JSON.stringify({ email, password }),
        });

        userMsg(true, "✅ Utilisateur créé");
        newEmail.value = "";
        newPassword.value = "";
      } catch (e) {
        userMsg(false, "❌ " + (e.message || e));
      }
    };
  }

  // --------- Modal event ----------
  const backdrop = document.getElementById("eventModalBackdrop");
  const btnClose = document.getElementById("btnCloseModal");
  const btnCancel = document.getElementById("btnCancelEvent");
  const btnSave = document.getElementById("btnSaveEvent");
  const notice = document.getElementById("eventModalNotice");

  const evTitle = document.getElementById("evTitle");
  const evCategory = document.getElementById("evCategory");
  const evStart = document.getElementById("evStart");
  const evEnd = document.getElementById("evEnd");

  let pendingRange = null;

  function toLocalInputValue(date) {
    const d = new Date(date);
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  function openModal({ start, end, allDay }) {
    pendingRange = { start, end, allDay };

    evTitle.value = "";
    evCategory.value = "";
    if (notice) notice.style.display = "none";

    evStart.value = toLocalInputValue(start);
    evEnd.value = toLocalInputValue(end || start);

    backdrop.style.display = "flex";
    setTimeout(() => evTitle.focus(), 0);
  }

  function closeModal() {
    backdrop.style.display = "none";
    pendingRange = null;
  }

  function showModalError(msg) {
    if (!notice) return alert(msg);
    notice.style.display = "block";
    notice.className = "notice error";
    notice.textContent = msg;
  }

  if (btnClose) btnClose.onclick = closeModal;
  if (btnCancel) btnCancel.onclick = closeModal;

  if (backdrop) {
    backdrop.addEventListener("click", (e) => {
      if (e.target === backdrop) closeModal();
    });
  }

  // --------- FullCalendar ----------
  const calendarEl = document.getElementById("calendar");
  if (!calendarEl) return;

  const calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: "dayGridMonth",
    locale: "fr",
    height: "auto",
    selectable: true,
    editable: true,

    headerToolbar: {
      left: "prev,next today",
      center: "title",
      right: "dayGridMonth,timeGridWeek,timeGridDay",
    },

    select(info) {
      if (!__app.getToken()) return alert("Connecte-toi pour ajouter un événement.");
      openModal({ start: info.start, end: info.end, allDay: info.allDay });
      calendar.unselect();
    },

    dateClick(info) {
      if (!__app.getToken()) return alert("Connecte-toi pour ajouter un événement.");
      const start = info.date;
      const end = new Date(start.getTime() + 60 * 60 * 1000);
      openModal({ start, end, allDay: info.allDay });
    },

    eventClick(info) {
      const cat = info.event.extendedProps.category;
      const label = cat ? ` [${cat}]` : "";
      if (confirm(`Supprimer "${info.event.title}"${label} ?`)) info.event.remove();
    },

    eventDidMount(arg) {
      const cat = arg.event.extendedProps.category;
      if (cat) arg.el.title = `${arg.event.title} (${cat})`;
    },
  });

  calendar.render();

  

  if (btnSave) {
    btnSave.onclick = () => {
      if (!pendingRange) return;

      const title = evTitle.value.trim();
      const category = evCategory.value.trim();
      const startVal = evStart.value;
      const endVal = evEnd.value;

      if (!title) return showModalError("Titre requis.");
      if (!startVal) return showModalError("Début requis.");
      if (!endVal) return showModalError("Fin requise.");

      const start = new Date(startVal);
      const end = new Date(endVal);
      if (end < start) return showModalError("La date de fin doit être après le début.");

      calendar.addEvent({
        title,
        start,
        end,
        allDay: false,
        extendedProps: { category },
      });

      closeModal();
    };
  }
});
