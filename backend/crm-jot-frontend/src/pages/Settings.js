import { useState, useEffect } from "react";
import {
  FiLock, FiUsers, FiUser, FiTrash2, FiEdit2,
  FiCheck, FiX, FiPlus, FiEye, FiEyeOff, FiShield,
  FiBriefcase, FiPackage, FiFileText,
  FiTruck, FiDollarSign, FiBell, FiSettings,
} from "react-icons/fi";

const uid  = () => localStorage.getItem("userId");
const role = () => localStorage.getItem("role");

// ─── helpers ─────────────────────────────────────────────────────────────────
function Toast({ msg, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3200);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div className={`set-toast set-toast-${type}`}>
      {type === "success" ? <FiCheck size={15}/> : <FiX size={15}/>} {msg}
    </div>
  );
}

function SectionCard({ icon: Icon, title, subtitle, children, noPad }) {
  return (
    <div className="set-card">
      <div className="set-card-head">
        <div className="set-card-icon"><Icon size={18}/></div>
        <div>
          <h3 className="set-card-title">{title}</h3>
          {subtitle && <p className="set-card-sub">{subtitle}</p>}
        </div>
      </div>
      <div className={noPad ? "" : "set-card-body"}>{children}</div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div className="set-field">
      {label && <label>{label}</label>}
      {children}
    </div>
  );
}

function SaveBtn({ onClick, loading, label = "Save Changes" }) {
  return (
    <button className="set-save-btn" onClick={onClick} disabled={loading}>
      {loading ? "Saving…" : label}
    </button>
  );
}

const load = (key, def) => {
  try { return JSON.parse(localStorage.getItem(key)) ?? def; }
  catch { return def; }
};
const persist = (key, val) => localStorage.setItem(key, JSON.stringify(val));

// =============================================================================
//  1. COMPANY
// =============================================================================
function CompanySettings({ onToast }) {
  const [f, setF] = useState(() => load("set_company", {
    name: "Western Agro Impex", gst: "", iec: "", pan: "", cin: "",
    address: "", phone: "", email: "", website: "",
    currency: "USD", timezone: "Asia/Kolkata",
  }));
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));

  return (
    <SectionCard icon={FiBriefcase} title="Company Settings" subtitle="Your organisation details">
      <div className="set-form-grid-3">
        <Field label="Company Name">
          <input value={f.name} onChange={e => set("name", e.target.value)} placeholder="Company name"/>
        </Field>
        <Field label="GST Number">
          <input value={f.gst} onChange={e => set("gst", e.target.value)} placeholder="27XXXXX..."/>
        </Field>
        <Field label="IEC Code">
          <input value={f.iec} onChange={e => set("iec", e.target.value)} placeholder="Import Export Code"/>
        </Field>
        <Field label="PAN Number">
          <input value={f.pan} onChange={e => set("pan", e.target.value)} placeholder="ABCDE1234F"/>
        </Field>
        <Field label="CIN Number">
          <input value={f.cin} onChange={e => set("cin", e.target.value)} placeholder="Company Identification No."/>
        </Field>
        <Field label="Contact Number">
          <input value={f.phone} onChange={e => set("phone", e.target.value)} placeholder="+91 XXXXXXXXXX"/>
        </Field>
        <Field label="Email Address">
          <input type="email" value={f.email} onChange={e => set("email", e.target.value)} placeholder="info@company.com"/>
        </Field>
        <Field label="Website">
          <input value={f.website} onChange={e => set("website", e.target.value)} placeholder="https://yourcompany.com"/>
        </Field>
        <Field label="Default Currency">
          <select value={f.currency} onChange={e => set("currency", e.target.value)}>
            {["USD","INR","AED","EUR","GBP","JPY","CNY"].map(c => <option key={c}>{c}</option>)}
          </select>
        </Field>
        <Field label="Default Timezone">
          <select value={f.timezone} onChange={e => set("timezone", e.target.value)}>
            {["Asia/Kolkata","Asia/Dubai","America/New_York","Europe/London","America/Los_Angeles"].map(z => <option key={z}>{z}</option>)}
          </select>
        </Field>
        <Field label="Registered Address">
          <textarea rows={2} value={f.address} onChange={e => set("address", e.target.value)} placeholder="Full registered address"/>
        </Field>
      </div>
      <div className="set-form-actions">
        <SaveBtn onClick={() => { persist("set_company", f); onToast("Company settings saved!"); }}/>
      </div>
    </SectionCard>
  );
}

// =============================================================================
//  2. USERS & ROLES
// =============================================================================
function TeamMembers({ onToast }) {
  const [users,    setUsers]    = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [form, setForm] = useState({ full_name:"", username:"", password:"", role:"member" });

  const fetchUsers = () =>
    fetch("http://localhost:5000/users")
      .then(r => r.json())
      .then(d => setUsers(Array.isArray(d) ? d : []))
      .catch(() => {});

  useEffect(() => { fetchUsers(); }, []);

  const openAdd = () => {
    setEditUser(null);
    setForm({ full_name:"", username:"", password:"", role:"member" });
    setShowForm(true);
  };

  const openEdit = (u) => {
    setEditUser(u);
    setForm({ full_name: u.full_name, username: u.username, password:"", role: u.role });
    setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!form.full_name || !form.username || (!editUser && !form.password)) {
      onToast("Fill all required fields", "error");
      return;
    }
    setLoading(true);
    try {
      const url    = editUser ? `http://localhost:5000/users/${editUser.id}` : "http://localhost:5000/users";
      const method = editUser ? "PUT" : "POST";
      const res    = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        onToast(editUser ? "User updated!" : "User added!");
        setShowForm(false);
        fetchUsers();
      } else {
        onToast(data.error || "Failed to save", "error");
      }
    } catch {
      onToast("Server error", "error");
    }
    setLoading(false);
  };

  const handleDelete = async (u) => {
    if (u.id === parseInt(uid())) {
      onToast("Cannot delete your own account", "error");
      return;
    }
    if (!window.confirm(`Delete "${u.full_name}"?`)) return;
    await fetch(`http://localhost:5000/users/${u.id}`, { method:"DELETE" }).catch(() => {});
    onToast("User deleted");
    fetchUsers();
  };

  const ROLE_COLORS = {
    admin:                  { bg:"#dcfce7", color:"#166534" },
    manager:                { bg:"#fef3c7", color:"#92400e" },
    member:                 { bg:"#dbeafe", color:"#1e40af" },
    "sales executive":      { bg:"#ede9fe", color:"#5b21b6" },
    "export manager":       { bg:"#fce7f3", color:"#9d174d" },
    "documentation officer":{ bg:"#ffedd5", color:"#c2410c" },
    accounts:               { bg:"#f0fdf4", color:"#15803d" },
    "warehouse manager":    { bg:"#f0f9ff", color:"#0369a1" },
  };

  return (
    <SectionCard icon={FiUsers} title="Users & Roles" subtitle="Manage team access">
      <button className="set-add-user-btn" onClick={openAdd}>
        <FiPlus size={14}/> Add New Member
      </button>

      {showForm && (
        <div className="set-user-form">
          <div className="set-form-row">
            <Field label="Full Name *">
              <input placeholder="Full name" value={form.full_name}
                onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))}/>
            </Field>
            <Field label="Username *">
              <input placeholder="username" value={form.username}
                onChange={e => setForm(p => ({ ...p, username: e.target.value }))}/>
            </Field>
          </div>
          <div className="set-form-row">
            <Field label={editUser ? "New Password (blank = keep)" : "Password *"}>
              <div className="set-input-wrap">
                <input type={showPass ? "text" : "password"} placeholder="Password"
                  value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))}/>
                <button className="set-eye" onClick={() => setShowPass(s => !s)}>
                  {showPass ? <FiEyeOff size={14}/> : <FiEye size={14}/>}
                </button>
              </div>
            </Field>
            <Field label="Role *">
              <select value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}>
                <option value="member">Member</option>
                <option value="manager">Manager</option>
                <option value="sales executive">Sales Executive</option>
                <option value="export manager">Export Manager</option>
                <option value="documentation officer">Documentation Officer</option>
                <option value="accounts">Accounts</option>
                <option value="warehouse manager">Warehouse Manager</option>
                <option value="admin">Admin</option>
              </select>
            </Field>
          </div>
          <div className="set-form-actions">
            <button className="set-cancel-btn" onClick={() => setShowForm(false)}>Cancel</button>
            <SaveBtn onClick={handleSubmit} loading={loading}
              label={editUser ? "Update Member" : "Add Member"}/>
          </div>
        </div>
      )}

      <div className="set-user-list">
        {users.map(u => {
          const rc   = ROLE_COLORS[u.role?.toLowerCase()] || ROLE_COLORS.member;
          const isMe = u.id === parseInt(uid());
          return (
            <div className="set-user-row" key={u.id}>
              <div className="set-user-avatar">
                {u.full_name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0,2)}
              </div>
              <div className="set-user-info">
                <strong>{u.full_name}{isMe && <span className="set-you-tag">You</span>}</strong>
                <span>@{u.username}</span>
              </div>
              <span className="set-role-badge" style={{ background: rc.bg, color: rc.color }}>
                {u.role}
              </span>
              <div className="set-user-actions">
                <button className="set-icon-btn" onClick={() => openEdit(u)}><FiEdit2 size={13}/></button>
                {!isMe && (
                  <button className="set-icon-btn set-icon-danger" onClick={() => handleDelete(u)}>
                    <FiTrash2 size={13}/>
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
//  3. CUSTOMER SETTINGS
// =============================================================================
function CustomerSettings({ onToast }) {
  const [f, setF] = useState(() => load("set_customer", {
    categories:    "Regular,Premium,VIP,Distributor",
    statuses:      "Active,Inactive,Blacklisted,Prospect",
    lead_sources:  "go4world,direct email,mandate,alibaba,referral,trade show",
    payment_terms: "30 days,60 days,90 days,advance,LC at sight",
    credit_limit:  "50000",
  }));
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));

  return (
    <SectionCard icon={FiUsers} title="Customer Settings" subtitle="Categories, statuses and lead sources">
      <div className="set-form-grid-2">
        <Field label="Customer Categories (comma separated)">
          <textarea rows={2} value={f.categories} onChange={e => set("categories", e.target.value)}/>
        </Field>
        <Field label="Customer Statuses">
          <textarea rows={2} value={f.statuses} onChange={e => set("statuses", e.target.value)}/>
        </Field>
        <Field label="Lead Sources">
          <textarea rows={2} value={f.lead_sources} onChange={e => set("lead_sources", e.target.value)}/>
        </Field>
        <Field label="Payment Terms">
          <textarea rows={2} value={f.payment_terms} onChange={e => set("payment_terms", e.target.value)}/>
        </Field>
        <Field label="Default Credit Limit (USD)">
          <input value={f.credit_limit} onChange={e => set("credit_limit", e.target.value)} placeholder="50000"/>
        </Field>
      </div>
      <div className="set-form-actions">
        <SaveBtn onClick={() => { persist("set_customer", f); onToast("Customer settings saved!"); }}/>
      </div>
    </SectionCard>
  );
}

// =============================================================================
//  4. SUPPLIER SETTINGS
// =============================================================================
function SupplierSettings({ onToast }) {
  const [f, setF] = useState(() => load("set_supplier", {
    categories:    "Manufacturer,Trader,Agent,Broker",
    payment_terms: "30 days,60 days,advance,LC",
    rating_system: "1-5 Stars",
    countries:     "India,China,UAE,USA,Pakistan",
  }));
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));

  return (
    <SectionCard icon={FiPackage} title="Supplier Settings" subtitle="Supplier categories and payment terms">
      <div className="set-form-grid-2">
        <Field label="Supplier Categories">
          <textarea rows={2} value={f.categories} onChange={e => set("categories", e.target.value)}/>
        </Field>
        <Field label="Payment Terms">
          <textarea rows={2} value={f.payment_terms} onChange={e => set("payment_terms", e.target.value)}/>
        </Field>
        <Field label="Rating System">
          <input value={f.rating_system} onChange={e => set("rating_system", e.target.value)}/>
        </Field>
        <Field label="Active Countries">
          <textarea rows={2} value={f.countries} onChange={e => set("countries", e.target.value)}/>
        </Field>
      </div>
      <div className="set-form-actions">
        <SaveBtn onClick={() => { persist("set_supplier", f); onToast("Supplier settings saved!"); }}/>
      </div>
    </SectionCard>
  );
}

// =============================================================================
//  5. PRODUCT SETTINGS
// =============================================================================
function ProductSettings({ onToast }) {
  const [f, setF] = useState(() => load("set_product", {
    categories: "Grains,Pulses,Spices,Sugar,Oil,Others",
    units:      "MT,KG,Quintal,Bags,Drums,Litres",
    packaging:  "Jute Bags,PP Bags,Bulk,Cartons,Drums",
    hs_codes:   "",
    sku_prefix: "JOT",
  }));
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));

  return (
    <SectionCard icon={FiPackage} title="Product Settings" subtitle="Categories, units and packaging types">
      <div className="set-form-grid-2">
        <Field label="Product Categories">
          <textarea rows={2} value={f.categories} onChange={e => set("categories", e.target.value)}/>
        </Field>
        <Field label="Units of Measurement">
          <textarea rows={2} value={f.units} onChange={e => set("units", e.target.value)}/>
        </Field>
        <Field label="Packaging Types">
          <textarea rows={2} value={f.packaging} onChange={e => set("packaging", e.target.value)}/>
        </Field>
        <Field label="Common HS Codes">
          <textarea rows={2} value={f.hs_codes} onChange={e => set("hs_codes", e.target.value)} placeholder="1001.90, 1701.99..."/>
        </Field>
        <Field label="SKU Prefix">
          <input value={f.sku_prefix} onChange={e => set("sku_prefix", e.target.value)} placeholder="JOT"/>
        </Field>
      </div>
      <div className="set-form-actions">
        <SaveBtn onClick={() => { persist("set_product", f); onToast("Product settings saved!"); }}/>
      </div>
    </SectionCard>
  );
}

// =============================================================================
//  6. SHIPPING & LOGISTICS
// =============================================================================
function ShippingSettings({ onToast }) {
  const [f, setF] = useState(() => load("set_shipping", {
    methods:            "Sea,Air,Road,Courier",
    ports_loading:      "Nhava Sheva (INNSA),Mundra (INMUN),Chennai (INMAA)",
    ports_discharge:    "Jebel Ali (AEJEA),Rotterdam (NLRTM),Colombo (LKCMB)",
    incoterms:          "FOB,CIF,EXW,DDP,CFR,DAP,FCA",
    container_types:    "20ft,40ft,40ft HC,LCL",
    freight_forwarders: "",
  }));
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));

  return (
    <SectionCard icon={FiTruck} title="Shipping & Logistics" subtitle="Ports, incoterms and shipping methods">
      <div className="set-form-grid-2">
        <Field label="Shipping Methods">
          <input value={f.methods} onChange={e => set("methods", e.target.value)}/>
        </Field>
        <Field label="Incoterms">
          <input value={f.incoterms} onChange={e => set("incoterms", e.target.value)}/>
        </Field>
        <Field label="Ports of Loading">
          <textarea rows={2} value={f.ports_loading} onChange={e => set("ports_loading", e.target.value)}/>
        </Field>
        <Field label="Ports of Discharge">
          <textarea rows={2} value={f.ports_discharge} onChange={e => set("ports_discharge", e.target.value)}/>
        </Field>
        <Field label="Container Types">
          <input value={f.container_types} onChange={e => set("container_types", e.target.value)}/>
        </Field>
        <Field label="Freight Forwarders">
          <textarea rows={2} value={f.freight_forwarders} onChange={e => set("freight_forwarders", e.target.value)} placeholder="Name, contact..."/>
        </Field>
      </div>
      <div className="set-form-actions">
        <SaveBtn onClick={() => { persist("set_shipping", f); onToast("Shipping settings saved!"); }}/>
      </div>
    </SectionCard>
  );
}

// =============================================================================
//  7. FINANCE & PAYMENT
// =============================================================================
function FinanceSettings({ onToast }) {
  const [f, setF] = useState(() => load("set_finance", {
    bank_name:"", account_number:"", ifsc:"", swift:"",
    account_holder:"", bank_branch:"",
    payment_modes:"SWIFT,LC,TT,Advance,Cheque",
    gst_rate:"18", tds_rate:"1",
    lc_terms:"90 days usance,60 days usance,LC at sight",
  }));
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));

  return (
    <SectionCard icon={FiDollarSign} title="Finance & Payment" subtitle="Bank details, payment modes and tax configuration">
      <h4 className="set-sub-heading">Bank Details</h4>
      <div className="set-form-grid-3">
        <Field label="Bank Name">
          <input value={f.bank_name} onChange={e => set("bank_name", e.target.value)} placeholder="State Bank of India"/>
        </Field>
        <Field label="Account Holder">
          <input value={f.account_holder} onChange={e => set("account_holder", e.target.value)}/>
        </Field>
        <Field label="Account Number">
          <input value={f.account_number} onChange={e => set("account_number", e.target.value)}/>
        </Field>
        <Field label="IFSC Code">
          <input value={f.ifsc} onChange={e => set("ifsc", e.target.value)}/>
        </Field>
        <Field label="SWIFT Code">
          <input value={f.swift} onChange={e => set("swift", e.target.value)}/>
        </Field>
        <Field label="Branch">
          <input value={f.bank_branch} onChange={e => set("bank_branch", e.target.value)}/>
        </Field>
      </div>
      <h4 className="set-sub-heading" style={{ marginTop: 20 }}>Tax & Payment</h4>
      <div className="set-form-grid-3">
        <Field label="GST Rate (%)">
          <input value={f.gst_rate} onChange={e => set("gst_rate", e.target.value)}/>
        </Field>
        <Field label="TDS Rate (%)">
          <input value={f.tds_rate} onChange={e => set("tds_rate", e.target.value)}/>
        </Field>
        <Field label="Payment Modes">
          <input value={f.payment_modes} onChange={e => set("payment_modes", e.target.value)}/>
        </Field>
        <Field label="LC Terms">
          <textarea rows={2} value={f.lc_terms} onChange={e => set("lc_terms", e.target.value)}/>
        </Field>
      </div>
      <div className="set-form-actions">
        <SaveBtn onClick={() => { persist("set_finance", f); onToast("Finance settings saved!"); }}/>
      </div>
    </SectionCard>
  );
}

// =============================================================================
//  8. EXPORT DOCUMENTS
// =============================================================================
function DocumentSettings({ onToast }) {
  const [f, setF] = useState(() => load("set_docs", {
    invoice_prefix:"INV", invoice_start:"1001",
    pi_prefix:"PI", shipping_bill_prefix:"SB",
    templates:"Commercial Invoice,Packing List,Proforma Invoice,Certificate of Origin,Shipping Bill",
    numbering_format:"PREFIX-YEAR-SEQ",
  }));
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));

  return (
    <SectionCard icon={FiFileText} title="Export Documentation" subtitle="Document templates and numbering rules">
      <div className="set-form-grid-3">
        <Field label="Invoice Prefix">
          <input value={f.invoice_prefix} onChange={e => set("invoice_prefix", e.target.value)} placeholder="INV"/>
        </Field>
        <Field label="Invoice Start Number">
          <input value={f.invoice_start} onChange={e => set("invoice_start", e.target.value)} placeholder="1001"/>
        </Field>
        <Field label="Proforma Invoice Prefix">
          <input value={f.pi_prefix} onChange={e => set("pi_prefix", e.target.value)} placeholder="PI"/>
        </Field>
        <Field label="Shipping Bill Prefix">
          <input value={f.shipping_bill_prefix} onChange={e => set("shipping_bill_prefix", e.target.value)} placeholder="SB"/>
        </Field>
        <Field label="Numbering Format">
          <input value={f.numbering_format} onChange={e => set("numbering_format", e.target.value)}/>
        </Field>
      </div>
      <Field label="Available Document Templates">
        <textarea rows={3} value={f.templates} onChange={e => set("templates", e.target.value)}/>
      </Field>
      <div className="set-form-actions">
        <SaveBtn onClick={() => { persist("set_docs", f); onToast("Document settings saved!"); }}/>
      </div>
    </SectionCard>
  );
}

// =============================================================================
//  9. NOTIFICATIONS
// =============================================================================
function NotificationSettings({ onToast }) {
  const [f, setF] = useState(() => load("set_notif", {
    email: true, whatsapp: false, sms: false,
    order_alerts: true, shipment_alerts: true, payment_reminders: true,
    email_address: "", whatsapp_number: "",
  }));
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));

  const Toggle = ({ k, label }) => (
    <div className="set-toggle-row">
      <span>{label}</span>
      <button className={`set-toggle ${f[k] ? "set-toggle-on" : ""}`} onClick={() => set(k, !f[k])}>
        <span className="set-toggle-thumb"/>
      </button>
    </div>
  );

  return (
    <SectionCard icon={FiBell} title="Notifications" subtitle="Configure alerts and reminders">
      <h4 className="set-sub-heading">Channels</h4>
      <Toggle k="email"    label="Email Notifications"/>
      <Toggle k="whatsapp" label="WhatsApp Notifications"/>
      <Toggle k="sms"      label="SMS Notifications"/>
      <h4 className="set-sub-heading" style={{ marginTop: 20 }}>Alert Types</h4>
      <Toggle k="order_alerts"      label="Order Status Alerts"/>
      <Toggle k="shipment_alerts"   label="Shipment Alerts"/>
      <Toggle k="payment_reminders" label="Payment Due Reminders"/>
      <h4 className="set-sub-heading" style={{ marginTop: 20 }}>Contact Info</h4>
      <div className="set-form-grid-2">
        <Field label="Notification Email">
          <input type="email" value={f.email_address} onChange={e => set("email_address", e.target.value)} placeholder="alerts@company.com"/>
        </Field>
        <Field label="WhatsApp Number">
          <input value={f.whatsapp_number} onChange={e => set("whatsapp_number", e.target.value)} placeholder="+91 XXXXXXXXXX"/>
        </Field>
      </div>
      <div className="set-form-actions">
        <SaveBtn onClick={() => { persist("set_notif", f); onToast("Notification settings saved!"); }}/>
      </div>
    </SectionCard>
  );
}

// =============================================================================
//  10. SECURITY
// =============================================================================
function SecuritySettings({ onToast }) {
  const [f, setF] = useState(() => load("set_security", {
    session_timeout: "60", two_factor: false,
    ip_restriction: "", login_history: true,
  }));
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));

  const Toggle = ({ k, label }) => (
    <div className="set-toggle-row">
      <span>{label}</span>
      <button className={`set-toggle ${f[k] ? "set-toggle-on" : ""}`} onClick={() => set(k, !f[k])}>
        <span className="set-toggle-thumb"/>
      </button>
    </div>
  );

  return (
    <SectionCard icon={FiShield} title="Security Settings" subtitle="Login policies and access control">
      <Toggle k="two_factor"    label="Two-Factor Authentication (coming soon)"/>
      <Toggle k="login_history" label="Track Login History"/>
      <div className="set-form-grid-2" style={{ marginTop: 16 }}>
        <Field label="Session Timeout (minutes)">
          <input type="number" value={f.session_timeout} onChange={e => set("session_timeout", e.target.value)} min="5" max="480"/>
        </Field>
        <Field label="Allowed IP Addresses (comma separated)">
          <input value={f.ip_restriction} onChange={e => set("ip_restriction", e.target.value)} placeholder="Leave blank for all IPs"/>
        </Field>
      </div>
      <div className="set-form-actions">
        <SaveBtn onClick={() => { persist("set_security", f); onToast("Security settings saved!"); }}/>
      </div>
    </SectionCard>
  );
}

// =============================================================================
//  11. CHANGE PASSWORD
// =============================================================================
function ChangePassword({ onToast }) {
  const [form,    setForm]    = useState({ current:"", newPass:"", confirm:"" });
  const [show,    setShow]    = useState({ current:false, newPass:false, confirm:false });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!form.current || !form.newPass || !form.confirm) {
      onToast("Fill all fields", "error"); return;
    }
    if (form.newPass.length < 4) {
      onToast("Min 4 characters", "error"); return;
    }
    if (form.newPass !== form.confirm) {
      onToast("Passwords don't match", "error"); return;
    }
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/users/${uid()}/password`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ current_password: form.current, new_password: form.newPass }),
      });
      const d = await res.json();
      if (res.ok) {
        onToast("Password updated!");
        setForm({ current:"", newPass:"", confirm:"" });
      } else {
        onToast(d.error || "Failed", "error");
      }
    } catch {
      onToast("Server error", "error");
    }
    setLoading(false);
  };

  const PwField = ({ label, field, placeholder }) => (
    <Field label={label}>
      <div className="set-input-wrap">
        <input type={show[field] ? "text" : "password"} placeholder={placeholder}
          value={form[field]} onChange={e => setForm(p => ({ ...p, [field]: e.target.value }))}/>
        <button className="set-eye" onClick={() => setShow(s => ({ ...s, [field]: !s[field] }))}>
          {show[field] ? <FiEyeOff size={14}/> : <FiEye size={14}/>}
        </button>
      </div>
    </Field>
  );

  return (
    <SectionCard icon={FiLock} title="Change Password" subtitle="Update your login password">
      <PwField label="Current Password" field="current"  placeholder="Current password"/>
      <PwField label="New Password"     field="newPass"  placeholder="Min 4 characters"/>
      <PwField label="Confirm Password" field="confirm"  placeholder="Confirm new password"/>
      <div className="set-form-actions">
        <SaveBtn onClick={handleSubmit} loading={loading} label="Update Password"/>
      </div>
    </SectionCard>
  );
}

// =============================================================================
//  12. MY PROFILE
// =============================================================================
function MyProfile({ onToast }) {
  const [form,    setForm]    = useState({ full_name: localStorage.getItem("username") || "" });
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!form.full_name.trim()) { onToast("Name cannot be empty", "error"); return; }
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/users/${uid()}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ full_name: form.full_name, role: role() }),
      });
      if (res.ok) {
        localStorage.setItem("username", form.full_name);
        onToast("Profile updated!");
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
      <Field label="Full Name">
        <input value={form.full_name} onChange={e => setForm({ full_name: e.target.value })}/>
      </Field>
      <Field label="Role">
        <input value={role() || ""} disabled style={{ opacity:0.5, cursor:"not-allowed" }}/>
      </Field>
      <div className="set-form-actions">
        <SaveBtn onClick={handleSave} loading={loading} label="Save Profile"/>
      </div>
    </SectionCard>
  );
}

// =============================================================================
//  13. PERMISSIONS TABLE
// =============================================================================
function RolePermissions() {
  const rows = [
    { feature:"Dashboard",              admin:true,  manager:true,  member:true  },
    { feature:"Calendar",               admin:true,  manager:true,  member:true  },
    { feature:"Inquiries",              admin:true,  manager:true,  member:true  },
    { feature:"Buyers",                 admin:true,  manager:true,  member:true  },
    { feature:"Sellers",                admin:true,  manager:true,  member:true  },
    { feature:"Companies",              admin:true,  manager:true,  member:false },
    { feature:"Documents",              admin:true,  manager:true,  member:false },
    { feature:"Analytics",              admin:true,  manager:true,  member:false },
    { feature:"Messages",               admin:true,  manager:true,  member:true  },
    { feature:"Delete records",         admin:true,  manager:false, member:false },
    { feature:"Settings",               admin:true,  manager:false, member:false },
    { feature:"Manage team",            admin:true,  manager:false, member:false },
    { feature:"Finance settings",       admin:true,  manager:false, member:false },
    { feature:"Export doc settings",    admin:true,  manager:true,  member:false },
  ];

  const Tick = ({ v }) => v
    ? <span style={{ color:"#16a34a", fontWeight:700, fontSize:16 }}>✓</span>
    : <span style={{ color:"#dc2626", fontWeight:700, fontSize:16 }}>✗</span>;

  return (
    <SectionCard icon={FiShield} title="Role Permissions" subtitle="Access control overview" noPad>
      <div className="set-perm-table-wrap">
        <table className="set-perm-table">
          <thead>
            <tr><th>Feature</th><th>Admin</th><th>Manager</th><th>Member</th></tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.feature}>
                <td>{r.feature}</td>
                <td><Tick v={r.admin}/></td>
                <td><Tick v={r.manager}/></td>
                <td><Tick v={r.member}/></td>
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
const TABS = [
  { id:"company",      label:"Company",        icon:FiBriefcase,  roles:["admin"] },
  { id:"profile",      label:"My Profile",     icon:FiUser,       roles:["admin","manager","member"] },
  { id:"password",     label:"Password",       icon:FiLock,       roles:["admin","manager","member"] },
  { id:"team",         label:"Users & Roles",  icon:FiUsers,      roles:["admin"] },
  { id:"customer",     label:"Customers",      icon:FiUsers,      roles:["admin","manager"] },
  { id:"supplier",     label:"Suppliers",      icon:FiPackage,    roles:["admin","manager"] },
  { id:"product",      label:"Products",       icon:FiPackage,    roles:["admin","manager"] },
  { id:"shipping",     label:"Shipping",       icon:FiTruck,      roles:["admin","manager"] },
  { id:"finance",      label:"Finance",        icon:FiDollarSign, roles:["admin"] },
  { id:"documents",    label:"Documents",      icon:FiFileText,   roles:["admin","manager"] },
  { id:"notifications",label:"Notifications",  icon:FiBell,       roles:["admin","manager"] },
  { id:"security",     label:"Security",       icon:FiShield,     roles:["admin"] },
  { id:"permissions",  label:"Permissions",    icon:FiSettings,   roles:["admin","manager","member"] },
];

function Settings() {
  const userRole    = role();
  const [toast, setToast]       = useState(null);
  const visibleTabs = TABS.filter(t => t.roles.includes(userRole));
  const [activeTab, setActiveTab] = useState(visibleTabs[0]?.id || "profile");

  const showToast = (msg, type = "success") => setToast({ msg, type });

  const CONTENT = {
    company:       <CompanySettings      onToast={showToast}/>,
    profile:       <MyProfile            onToast={showToast}/>,
    password:      <ChangePassword       onToast={showToast}/>,
    team:          <TeamMembers          onToast={showToast}/>,
    customer:      <CustomerSettings     onToast={showToast}/>,
    supplier:      <SupplierSettings     onToast={showToast}/>,
    product:       <ProductSettings      onToast={showToast}/>,
    shipping:      <ShippingSettings     onToast={showToast}/>,
    finance:       <FinanceSettings      onToast={showToast}/>,
    documents:     <DocumentSettings     onToast={showToast}/>,
    notifications: <NotificationSettings onToast={showToast}/>,
    security:      <SecuritySettings     onToast={showToast}/>,
    permissions:   <RolePermissions/>,
  };

  return (
    <div className="set-page">
      {toast && (
        <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)}/>
      )}

      <div className="jot-header" style={{ marginBottom: 0 }}>
        <div>
          <h1 className="jot-title">Settings</h1>
          <p className="jot-subtitle">Manage your CRM, team and preferences</p>
        </div>
      </div>

      <div className="set-layout">
        <div className="set-tabs">
          {visibleTabs.map(t => (
            <button
              key={t.id}
              className={`set-tab ${activeTab === t.id ? "set-tab-active" : ""}`}
              onClick={() => setActiveTab(t.id)}
            >
              <t.icon size={15}/> {t.label}
            </button>
          ))}
        </div>

        <div className="set-content">
          {CONTENT[activeTab]}
        </div>
      </div>
    </div>
  );
}

export default Settings;