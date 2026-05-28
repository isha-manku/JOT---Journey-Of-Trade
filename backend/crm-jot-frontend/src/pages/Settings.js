import { useState, useEffect } from "react";
import {
  FiLock, FiUsers, FiUser, FiTrash2, FiEdit2,
  FiCheck, FiX, FiPlus, FiEye, FiEyeOff, FiShield,
  FiGlobe,
} from "react-icons/fi";

const currentUserId   = () => localStorage.getItem("userId");
const currentUserRole = () => localStorage.getItem("role");

function SectionCard({ icon: Icon, title, subtitle, children }) {
  return (
    <div className="set-card">
      <div className="set-card-head">
        <div className="set-card-icon"><Icon size={18} /></div>
        <div>
          <h3 className="set-card-title">{title}</h3>
          {subtitle && <p className="set-card-sub">{subtitle}</p>}
        </div>
      </div>
      <div className="set-card-body">{children}</div>
    </div>
  );
}

function Toast({ msg, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className={`set-toast set-toast-${type}`}>
      {type === "success" ? <FiCheck size={15} /> : <FiX size={15} />}
      {msg}
    </div>
  );
}

// =============================================================================
//  CHANGE PASSWORD
// =============================================================================
function ChangePassword({ onToast }) {
  const [form, setForm]       = useState({ current: "", newPass: "", confirm: "" });
  const [show, setShow]       = useState({ current: false, newPass: false, confirm: false });
  const [loading, setLoading] = useState(false);

  const toggle = (field) => setShow(s => ({ ...s, [field]: !s[field] }));

  const handleSubmit = async () => {
    if (!form.current || !form.newPass || !form.confirm) {
      onToast("Please fill all fields", "error"); return;
    }
    if (form.newPass.length < 4) {
      onToast("New password must be at least 4 characters", "error"); return;
    }
    if (form.newPass !== form.confirm) {
      onToast("New passwords do not match", "error"); return;
    }

    setLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/users/${currentUserId()}/password`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          current_password: form.current,
          new_password: form.newPass,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        onToast(data.error || "Failed to update password", "error");
      } else {
        onToast("Password updated successfully!", "success");
        setForm({ current: "", newPass: "", confirm: "" });
      }
    } catch {
      onToast("Server error — is backend running?", "error");
    }
    setLoading(false);
  };

  const Field = ({ label, field, placeholder }) => (
    <div className="set-field">
      <label>{label}</label>
      <div className="set-input-wrap">
        <input
          type={show[field] ? "text" : "password"}
          placeholder={placeholder}
          value={form[field]}
          onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
        />
        <button className="set-eye" onClick={() => toggle(field)}>
          {show[field] ? <FiEyeOff size={15} /> : <FiEye size={15} />}
        </button>
      </div>
    </div>
  );

  return (
    <SectionCard icon={FiLock} title="Change Password" subtitle="Update your login password">
      <Field label="Current Password" field="current"  placeholder="Enter current password" />
      <Field label="New Password"     field="newPass"  placeholder="Minimum 4 characters" />
      <Field label="Confirm Password" field="confirm"  placeholder="Confirm new password" />
      <button className="set-save-btn" onClick={handleSubmit} disabled={loading}>
        {loading ? "Updating..." : "Update Password"}
      </button>
    </SectionCard>
  );
}

// =============================================================================
//  TEAM MEMBERS (admin only)
// =============================================================================
function TeamMembers({ onToast }) {
  const [users,    setUsers]    = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [form, setForm] = useState({
    full_name: "", username: "", password: "", role: "member",
  });

  const fetchUsers = () => {
    fetch("http://localhost:5000/users")
      .then(r => r.json())
      .then(data => setUsers(Array.isArray(data) ? data : []))
      .catch(() => {});
  };

  useEffect(() => { fetchUsers(); }, []);

  const openAdd = () => {
    setEditUser(null);
    setForm({ full_name: "", username: "", password: "", role: "member" });
    setShowForm(true);
  };

  const openEdit = (user) => {
    setEditUser(user);
    setForm({ full_name: user.full_name, username: user.username, password: "", role: user.role });
    setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!form.full_name || !form.username || (!editUser && !form.password)) {
      onToast("Please fill all required fields", "error"); return;
    }
    setLoading(true);
    try {
      const url    = editUser
        ? `http://localhost:5000/users/${editUser.id}`
        : "http://localhost:5000/users";
      const method = editUser ? "PUT" : "POST";
      const res    = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        onToast(data.error || "Failed to save", "error");
      } else {
        onToast(editUser ? "User updated!" : "User added!", "success");
        setShowForm(false);
        fetchUsers();
      }
    } catch {
      onToast("Server error", "error");
    }
    setLoading(false);
  };

  const handleDelete = async (user) => {
    if (user.id === parseInt(currentUserId())) {
      onToast("You cannot delete your own account", "error"); return;
    }
    if (!window.confirm(`Delete "${user.full_name}"?`)) return;
    try {
      await fetch(`http://localhost:5000/users/${user.id}`, { method: "DELETE" });
      onToast("User deleted", "success");
      fetchUsers();
    } catch {
      onToast("Server error", "error");
    }
  };

  const ROLE_COLORS = {
    admin:   { bg: "#dcfce7", color: "#166534" },
    manager: { bg: "#fef3c7", color: "#92400e" },
    member:  { bg: "#dbeafe", color: "#1e40af" },
  };

  return (
    <SectionCard icon={FiUsers} title="Team Members" subtitle="Manage who has access to the CRM">

      <button className="set-add-user-btn" onClick={openAdd}>
        <FiPlus size={14} /> Add New Member
      </button>

      {showForm && (
        <div className="set-user-form">
          <div className="set-form-row">
            <div className="set-field">
              <label>Full Name *</label>
              <input
                placeholder="e.g. Priya Sharma"
                value={form.full_name}
                onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
              />
            </div>
            <div className="set-field">
              <label>Username *</label>
              <input
                placeholder="e.g. priya123"
                value={form.username}
                onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
              />
            </div>
          </div>

          <div className="set-form-row">
            <div className="set-field">
              <label>{editUser ? "New Password (blank = keep old)" : "Password *"}</label>
              <div className="set-input-wrap">
                <input
                  type={showPass ? "text" : "password"}
                  placeholder="Password"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                />
                <button className="set-eye" onClick={() => setShowPass(s => !s)}>
                  {showPass ? <FiEyeOff size={15} /> : <FiEye size={15} />}
                </button>
              </div>
            </div>
            <div className="set-field">
              <label>Role *</label>
              <select
                value={form.role}
                onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
              >
                <option value="member">Member — view &amp; add only</option>
                <option value="manager">Manager — add &amp; edit, no settings</option>
                <option value="admin">Admin — full access</option>
              </select>
            </div>
          </div>

          <div className="set-form-actions">
            <button className="set-cancel-btn" onClick={() => setShowForm(false)}>Cancel</button>
            <button className="set-save-btn" onClick={handleSubmit} disabled={loading}>
              {loading ? "Saving..." : editUser ? "Update Member" : "Add Member"}
            </button>
          </div>
        </div>
      )}

      <div className="set-user-list">
        {users.map(user => {
          const rc  = ROLE_COLORS[user.role] || ROLE_COLORS.member;
          const isMe = user.id === parseInt(currentUserId());
          return (
            <div className="set-user-row" key={user.id}>
              <div className="set-user-avatar">
                {user.full_name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)}
              </div>
              <div className="set-user-info">
                <strong>
                  {user.full_name}
                  {isMe && <span className="set-you-tag">You</span>}
                </strong>
                <span>@{user.username}</span>
              </div>
              <span className="set-role-badge" style={{ background: rc.bg, color: rc.color }}>
                {user.role}
              </span>
              <div className="set-user-actions">
                <button className="set-icon-btn" onClick={() => openEdit(user)} title="Edit">
                  <FiEdit2 size={14} />
                </button>
                {!isMe && (
                  <button className="set-icon-btn set-icon-danger" onClick={() => handleDelete(user)} title="Delete">
                    <FiTrash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

    </SectionCard>
  );
}

// =============================================================================
//  MY PROFILE
// =============================================================================
function MyProfile({ onToast }) {
  const role    = localStorage.getItem("role")    || "";
  const userId  = currentUserId();
  const [form,    setForm]    = useState({ full_name: localStorage.getItem("username") || "" });
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!form.full_name.trim()) { onToast("Name cannot be empty", "error"); return; }
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ full_name: form.full_name, role }),
      });
      if (res.ok) {
        localStorage.setItem("username", form.full_name);
        onToast("Profile updated!", "success");
      } else {
        onToast("Failed to update", "error");
      }
    } catch {
      onToast("Server error", "error");
    }
    setLoading(false);
  };

  return (
    <SectionCard icon={FiUser} title="My Profile" subtitle="Update your display name">
      <div className="set-field">
        <label>Full Name</label>
        <input
          value={form.full_name}
          onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
          placeholder="Your full name"
        />
      </div>
      <div className="set-field">
        <label>Role</label>
        <input value={role} disabled style={{ opacity: 0.6, cursor: "not-allowed" }} />
      </div>
      <button className="set-save-btn" onClick={handleSave} disabled={loading}>
        {loading ? "Saving..." : "Save Profile"}
      </button>
    </SectionCard>
  );
}

// =============================================================================
//  CRM INFO (admin only)
// =============================================================================
function CrmInfo({ onToast }) {
  const saved = JSON.parse(localStorage.getItem("crm_info") || "{}");
  const [info, setInfo] = useState({
    company_name: saved.company_name || "Western Agro Impex",
    crm_name:     saved.crm_name     || "JOT — Journey of Trade",
    timezone:     saved.timezone     || "Asia/Kolkata",
    currency:     saved.currency     || "USD",
  });

  const handleSave = () => {
    localStorage.setItem("crm_info", JSON.stringify(info));
    onToast("CRM info saved!", "success");
  };

  return (
    <SectionCard icon={FiGlobe} title="CRM Information" subtitle="Basic details about your organisation">
      <div className="set-form-row">
        <div className="set-field">
          <label>Company Name</label>
          <input value={info.company_name}
            onChange={e => setInfo(i => ({ ...i, company_name: e.target.value }))} />
        </div>
        <div className="set-field">
          <label>CRM Name</label>
          <input value={info.crm_name}
            onChange={e => setInfo(i => ({ ...i, crm_name: e.target.value }))} />
        </div>
      </div>
      <div className="set-form-row">
        <div className="set-field">
          <label>Timezone</label>
          <select value={info.timezone} onChange={e => setInfo(i => ({ ...i, timezone: e.target.value }))}>
            <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
            <option value="Asia/Dubai">Asia/Dubai (GST)</option>
            <option value="America/New_York">America/New_York (EST)</option>
            <option value="Europe/London">Europe/London (GMT)</option>
            <option value="America/Los_Angeles">America/Los_Angeles (PST)</option>
          </select>
        </div>
        <div className="set-field">
          <label>Default Currency</label>
          <select value={info.currency} onChange={e => setInfo(i => ({ ...i, currency: e.target.value }))}>
            <option value="USD">USD — US Dollar</option>
            <option value="INR">INR — Indian Rupee</option>
            <option value="AED">AED — UAE Dirham</option>
            <option value="EUR">EUR — Euro</option>
            <option value="GBP">GBP — British Pound</option>
          </select>
        </div>
      </div>
      <button className="set-save-btn" onClick={handleSave}>Save Info</button>
    </SectionCard>
  );
}

// =============================================================================
//  ROLE PERMISSIONS
// =============================================================================
function RolePermissions() {
  const rows = [
    { feature: "Dashboard",      admin: true,  manager: true,  member: true  },
    { feature: "Calendar",       admin: true,  manager: true,  member: true  },
    { feature: "Inquiries",      admin: true,  manager: true,  member: true  },
    { feature: "Buyers",         admin: true,  manager: true,  member: true  },
    { feature: "Sellers",        admin: true,  manager: true,  member: true  },
    { feature: "Companies",      admin: true,  manager: true,  member: false },
    { feature: "Documents",      admin: true,  manager: true,  member: false },
    { feature: "Analytics",      admin: true,  manager: true,  member: false },
    { feature: "Delete records", admin: true,  manager: false, member: false },
    { feature: "Settings",       admin: true,  manager: false, member: false },
    { feature: "Manage team",    admin: true,  manager: false, member: false },
  ];

  const Tick = ({ v }) => v
    ? <span style={{ color: "#16a34a", fontWeight: 700 }}>✓</span>
    : <span style={{ color: "#dc2626", fontWeight: 700 }}>✗</span>;

  return (
    <SectionCard icon={FiShield} title="Role Permissions" subtitle="What each role can access">
      <div className="set-perm-table-wrap">
        <table className="set-perm-table">
          <thead>
            <tr>
              <th>Feature</th>
              <th>Admin</th>
              <th>Manager</th>
              <th>Member</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(row => (
              <tr key={row.feature}>
                <td>{row.feature}</td>
                <td><Tick v={row.admin}   /></td>
                <td><Tick v={row.manager} /></td>
                <td><Tick v={row.member}  /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SectionCard>
  );
}

// =============================================================================
//  MAIN SETTINGS PAGE
// =============================================================================
function Settings() {
  const role  = currentUserRole();
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = "success") => setToast({ msg, type });

  const TABS = [
    { id: "profile",     label: "My Profile",  icon: FiUser,   roles: ["admin","manager","member"] },
    { id: "password",    label: "Password",     icon: FiLock,   roles: ["admin","manager","member"] },
    { id: "team",        label: "Team Members", icon: FiUsers,  roles: ["admin"] },
    { id: "crm",         label: "CRM Info",     icon: FiGlobe,  roles: ["admin"] },
    { id: "permissions", label: "Permissions",  icon: FiShield, roles: ["admin","manager","member"] },
  ];

  const visibleTabs = TABS.filter(t => t.roles.includes(role));
  const [activeTab, setActiveTab] = useState(visibleTabs[0]?.id || "profile");

  return (
    <div className="set-page">

      {toast && (
        <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />
      )}

      <div className="jot-header" style={{ marginBottom: 0 }}>
        <div>
          <h1 className="jot-title">Settings</h1>
          <p className="jot-subtitle">Manage your account and CRM preferences</p>
        </div>
      </div>

      <div className="set-layout">

        <div className="set-tabs">
          {visibleTabs.map(tab => (
            <button
              key={tab.id}
              className={`set-tab ${activeTab === tab.id ? "set-tab-active" : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="set-content">
          {activeTab === "profile"     && <MyProfile      onToast={showToast} />}
          {activeTab === "password"    && <ChangePassword  onToast={showToast} />}
          {activeTab === "team"        && <TeamMembers     onToast={showToast} />}
          {activeTab === "crm"         && <CrmInfo         onToast={showToast} />}
          {activeTab === "permissions" && <RolePermissions />}
        </div>

      </div>
    </div>
  );
}

export default Settings;