// frontend/assets/user.js
const __users = (() => {
  const notice = document.getElementById("notice");
  const table = document.getElementById("usersTable");

  function show(type, msg) {
    if (!notice) return alert(msg);
    notice.style.display = "block";
    notice.className = "notice " + type;
    notice.textContent = msg;
  }

  async function load() {
    const data = await __app.api("/api/admin/users");
    render(data);
  }

  function render(users) {
    table.innerHTML = `
      <tr style="text-align:left; border-bottom:1px solid #1f2937;">
        <th style="padding:10px">ID</th>
        <th style="padding:10px">Email</th>
        <th style="padding:10px">Roles</th>
        <th style="padding:10px">Action</th>
      </tr>
      ${users.map(u => `
        <tr style="border-bottom:1px solid #1f2937;">
          <td style="padding:10px">${u.id}</td>
          <td style="padding:10px">${u.email}</td>
          <td style="padding:10px">
            <input data-id="${u.id}" class="rolesInput" value="${(u.roles||[]).join(",")}" style="width:100%">
          </td>
          <td style="padding:10px; display:flex; gap:10px; align-items:center;">
            <button class="btn btn-ghost saveBtn" data-id="${u.id}">💾 Sauver</button>
            <button class="btn btn-ghost deleteBtn" data-id="${u.id}" data-email="${u.email}">🗑️ Supprimer</button>
          </td>
        </tr>
      `).join("")}
    `;

    // ---- Sauver roles ----
    document.querySelectorAll(".saveBtn").forEach(btn => {
      btn.onclick = async () => {
        const id = btn.dataset.id;
        const input = document.querySelector(`.rolesInput[data-id="${id}"]`);
        const roles = (input.value || "").split(",").map(s => s.trim()).filter(Boolean);

        try {
          await __app.api(`/api/admin/users/${id}/roles`, {
            method: "POST",
            body: JSON.stringify({ roles })
          });
          show("success", "✅ Roles mis à jour");
          await load();
        } catch (e) {
          show("error", "❌ " + (e.message || e));
        }
      };
    });

    // ---- Supprimer user ----
    document.querySelectorAll(".deleteBtn").forEach(btn => {
      btn.onclick = async () => {
        const id = btn.dataset.id;
        const email = btn.dataset.email || "";

        if (!confirm(`Supprimer l'utilisateur "${email}" (id=${id}) ?`)) return;

        try {
          // ✅ nécessite un endpoint backend: DELETE /api/admin/users/{id}
          await __app.api(`/api/admin/users/${id}`, { method: "DELETE" });

          show("success", "✅ Utilisateur supprimé");
          await load();
        } catch (e) {
          show("error", "❌ " + (e.message || e));
        }
      };
    });
  }

  async function init() {
    // ✅ Branche le bouton "Créer utilisateur"
    const btnCreate = document.getElementById("btnCreate");
    if (btnCreate) {
      btnCreate.onclick = async () => {
        const email = document.getElementById("newEmail").value.trim();
        const password = document.getElementById("newPassword").value;

        if (!email || !password) return show("error", "❌ Email + mot de passe requis");

        try {
          await __app.api("/api/admin/users", {
            method: "POST",
            body: JSON.stringify({ email, password })
          });

          show("success", "✅ Utilisateur créé");
          document.getElementById("newEmail").value = "";
          document.getElementById("newPassword").value = "";
          await load();
        } catch (e) {
          show("error", "❌ " + (e.message || e));
        }
      };
    }

    await load();
  }

  return { init };
})();
