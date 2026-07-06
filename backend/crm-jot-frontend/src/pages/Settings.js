import { useState, useEffect, useCallback } from "react";
import {
  FiLock, FiUsers, FiTrash2, FiEdit2,
  FiCheck, FiX, FiPlus, FiEye, FiEyeOff, FiShield,
  FiBriefcase, FiPackage, FiTruck, FiBell, FiSettings,
  FiChevronDown, FiChevronRight, FiMail, FiSend,
  FiRefreshCw, FiKey, FiClock,
} from "react-icons/fi";

const API = "http://localhost:5000";
const uid    = () => localStorage.getItem("userId");
const getRole = () => localStorage.getItem("role");
const isAdmin = () => getRole() === "admin";

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ msg, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, [onClose]);
  return (
    <div style={{
      position:"fixed", top:20, right:20, zIndex:9999,
      background: type==="error" ? "#fee2e2" : "#dcfce7",
      color: type==="error" ? "#991b1b" : "#166534",
      border: `1px solid ${type==="error" ? "#fca5a5" : "#86efac"}`,
      padding:"12px 20px", borderRadius:10, fontWeight:600,
      display:"flex", alignItems:"center", gap:8, fontSize:13,
      boxShadow:"0 4px 20px rgba(0,0,0,0.12)"
    }}>
      {type==="error" ? <FiX size={15}/> : <FiCheck size={15}/>} {msg}
    </div>
  );
}

// ─── Section Card ─────────────────────────────────────────────────────────────
function SectionCard({ icon: Icon, title, subtitle, children, noPad, badge }) {
  return (
    <div className="set-card">
      <div className="set-card-head">
        <div className="set-card-icon"><Icon size={18}/></div>
        <div style={{flex:1}}>
          <h3 className="set-card-title">{title}</h3>
          {subtitle && <p className="set-card-sub">{subtitle}</p>}
        </div>
        {badge && <span className="set-read-only-badge">{badge}</span>}
      </div>
      <div className={noPad ? "" : "set-card-body"}>{children}</div>
    </div>
  );
}

function Field({ label, children, half }) {
  return (
    <div className="set-field" style={half ? {gridColumn:"span 1"} : {}}>
      {label && <label>{label}</label>}
      {children}
    </div>
  );
}

function SaveBtn({ onClick, loading, label = "Save Changes", disabled }) {
  return (
    <button className="set-save-btn" onClick={onClick} disabled={loading || disabled}>
      {loading ? <><FiRefreshCw size={13} style={{animation:"spin 1s linear infinite"}}/> Saving…</> : label}
    </button>
  );
}

function ReadOnlyNotice() {
  return (
    <div style={{
      background:"#fef3c7", border:"1px solid #fcd34d",
      borderRadius:8, padding:"10px 14px", marginBottom:16,
      color:"#92400e", fontSize:13, display:"flex", alignItems:"center", gap:8
    }}>
      <FiEye size={14}/> You are viewing in read-only mode. Contact admin to make changes.
    </div>
  );
}

// ─── Toggle ──────────────────────────────────────────────────────────────────
function Toggle({ value, onChange, label, disabled }) {
  return (
    <div className="set-toggle-row">
      <span>{label}</span>
      <button
        className={`set-toggle ${value ? "set-toggle-on" : ""}`}
        onClick={() => !disabled && onChange(!value)}
        style={disabled ? {opacity:0.5,cursor:"not-allowed"} : {}}
      >
        <span className="set-toggle-thumb"/>
      </button>
    </div>
  );
}

// =============================================================================
//  1. COMPANY SETTINGS
// =============================================================================
function CompanySettings({ onToast }) {
  const [companies, setCompanies] = useState([]);
  const [activeId,  setActiveId]  = useState(null);
  const [form,      setForm]      = useState(null);
  const [loading,   setLoading]   = useState(false);
  const [showAdd,   setShowAdd]   = useState(false);
  const [addForm,   setAddForm]   = useState({ name:"", gst:"", iec:"", pan:"", cin:"", phone:"", email:"", website:"", address:"", currency:"USD", timezone:"Asia/Kolkata" });
  const admin = isAdmin();

  const fetchCompanies = useCallback(() => {
    fetch(`${API}/settings/companies`)
      .then(r => r.json())
      .then(d => {
        const arr = Array.isArray(d) ? d : [];
        setCompanies(arr);
        if (arr.length > 0 && !activeId) {
          const def = arr.find(c => c.is_default) || arr[0];
          setActiveId(def.id);
          setForm({...def});
        }
      }).catch(() => {});
  }, [activeId]);

  useEffect(() => { fetchCompanies(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSelect = (c) => {
    setActiveId(c.id);
    setForm({...c});
  };

  const handleSave = async () => {
    if (!form?.name) { onToast("Company name required","error"); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API}/settings/companies/${form.id}`, {
        method:"PUT", headers:{"Content-Type":"application/json"}, body:JSON.stringify(form)
      });
      if (res.ok) { onToast("Company saved!"); fetchCompanies(); }
      else onToast("Save failed","error");
    } catch { onToast("Server error","error"); }
    setLoading(false);
  };

  const handleAdd = async () => {
    if (!addForm.name) { onToast("Company name required","error"); return; }
    try {
      await fetch(`${API}/settings/companies`, {
        method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(addForm)
      });
      onToast("Company added!");
      setShowAdd(false);
      setAddForm({ name:"", gst:"", iec:"", pan:"", cin:"", phone:"", email:"", website:"", address:"", currency:"USD", timezone:"Asia/Kolkata" });
      setActiveId(null);
      fetchCompanies();
    } catch { onToast("Server error","error"); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this company?")) return;
    await fetch(`${API}/settings/companies/${id}`, { method:"DELETE" }).catch(()=>{});
    setActiveId(null); setForm(null);
    fetchCompanies();
    onToast("Company deleted");
  };

  const set = (k,v) => setForm(p => ({...p, [k]:v}));

  const CURRENCIES = ["USD","INR","AED","EUR","GBP","JPY","CNY"];
  const TIMEZONES  = ["Asia/Kolkata","Asia/Dubai","America/New_York","Europe/London","America/Los_Angeles"];

  return (
    <SectionCard icon={FiBriefcase} title="Company Settings" subtitle="Manage your company profiles" badge={!admin?"View Only":null}>
      {!admin && <ReadOnlyNotice/>}

      {/* Company Selector Bar */}
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:20,flexWrap:"wrap"}}>
        {companies.map(c => (
          <button key={c.id}
            onClick={() => handleSelect(c)}
            style={{
              padding:"8px 18px", borderRadius:20, cursor:"pointer", fontSize:13,
              fontWeight:600, border:"2px solid",
              borderColor: activeId===c.id ? "#c9a96e" : "#d1d5db",
              background: activeId===c.id ? "#0e2318" : "#fff",
              color: activeId===c.id ? "#c9a96e" : "#374151",
              transition:"all 0.2s"
            }}
          >{c.name}{c.is_default ? " ★" : ""}</button>
        ))}
        {admin && (
          <button className="set-add-user-btn" onClick={() => setShowAdd(s=>!s)}>
            <FiPlus size={13}/> Add Company
          </button>
        )}
      </div>

      {/* Add Company Form */}
      {showAdd && admin && (
        <div style={{background:"#f9fafb",border:"1px solid #e5e7eb",borderRadius:10,padding:20,marginBottom:20}}>
          <h4 style={{margin:"0 0 14px",color:"#0e2318",fontSize:14}}>New Company</h4>
          <div className="set-form-grid-3">
            {[["name","Company Name","Western Agro Impex"],["gst","GST Number","27XXXXX..."],["iec","IEC Code",""],
              ["pan","PAN Number","ABCDE1234F"],["cin","CIN Number",""],["phone","Phone","+91 XXXXXXXXXX"],
              ["email","Email","info@company.com"],["website","Website","https://"]
            ].map(([k,label,ph])=>(
              <Field label={label} key={k}>
                <input value={addForm[k]||""} onChange={e=>setAddForm(p=>({...p,[k]:e.target.value}))} placeholder={ph}/>
              </Field>
            ))}
            <Field label="Currency">
              <select value={addForm.currency} onChange={e=>setAddForm(p=>({...p,currency:e.target.value}))}>
                {CURRENCIES.map(c=><option key={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Timezone">
              <select value={addForm.timezone} onChange={e=>setAddForm(p=>({...p,timezone:e.target.value}))}>
                {TIMEZONES.map(z=><option key={z}>{z}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Address">
            <textarea rows={2} value={addForm.address||""} onChange={e=>setAddForm(p=>({...p,address:e.target.value}))} placeholder="Full registered address"/>
          </Field>
          <div className="set-form-actions">
            <button className="set-cancel-btn" onClick={()=>setShowAdd(false)}>Cancel</button>
            <SaveBtn onClick={handleAdd} label="Add Company"/>
          </div>
        </div>
      )}

      {/* Active Company Form */}
      {form && (
        <>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
            <h4 style={{margin:0,color:"#0e2318",fontSize:15,fontWeight:700}}>{form.name}</h4>
            {admin && companies.length > 1 && (
              <button className="set-icon-btn set-icon-danger" onClick={()=>handleDelete(form.id)}><FiTrash2 size={13}/></button>
            )}
          </div>
          <div className="set-form-grid-3">
            {[["name","Company Name"],["gst","GST Number"],["iec","IEC Code"],
              ["pan","PAN Number"],["cin","CIN Number"],["phone","Contact Number"],
              ["email","Email Address"],["website","Website"]
            ].map(([k,label])=>(
              <Field label={label} key={k}>
                <input value={form[k]||""} onChange={e=>set(k,e.target.value)} disabled={!admin}
                  style={!admin?{background:"#f3f4f6",cursor:"not-allowed"}:{}}/>
              </Field>
            ))}
            <Field label="Currency">
              <select value={form.currency||"USD"} onChange={e=>set("currency",e.target.value)} disabled={!admin}>
                {CURRENCIES.map(c=><option key={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Timezone">
              <select value={form.timezone||"Asia/Kolkata"} onChange={e=>set("timezone",e.target.value)} disabled={!admin}>
                {TIMEZONES.map(z=><option key={z}>{z}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Registered Address">
            <textarea rows={2} value={form.address||""} onChange={e=>set("address",e.target.value)} disabled={!admin}
              style={!admin?{background:"#f3f4f6",cursor:"not-allowed"}:{}}/>
          </Field>
          {admin && (
            <div className="set-form-actions">
              <label style={{display:"flex",alignItems:"center",gap:8,fontSize:13,color:"#555",cursor:"pointer"}}>
                <input type="checkbox" checked={!!form.is_default} onChange={e=>set("is_default",e.target.checked)}/>
                Set as default company
              </label>
              <SaveBtn onClick={handleSave} loading={loading}/>
            </div>
          )}
        </>
      )}

      {!form && companies.length === 0 && (
        <div style={{textAlign:"center",padding:40,color:"#9ca3af"}}>
          No companies yet. Click "Add Company" to get started.
        </div>
      )}
    </SectionCard>
  );
}

// =============================================================================
//  2. USERS & ROLES
// =============================================================================
function TeamMembers({ onToast }) {
  const [users, setUsers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [form, setForm] = useState({ full_name:"", username:"", password:"", role:"member" });
  const admin = isAdmin();

  const fetchUsers = () =>
    fetch(`${API}/users`).then(r=>r.json()).then(d=>setUsers(Array.isArray(d)?d:[])).catch(()=>{});

  useEffect(() => { fetchUsers(); }, []);

  const openAdd  = () => { setEditUser(null); setForm({full_name:"",username:"",password:"",role:"member"}); setShowForm(true); };
  const openEdit = (u) => { setEditUser(u); setForm({full_name:u.full_name,username:u.username,password:"",role:u.role}); setShowForm(true); };

  const handleSubmit = async () => {
    if (!form.full_name||!form.username||(!editUser&&!form.password)) { onToast("Fill all required fields","error"); return; }
    setLoading(true);
    try {
      const url    = editUser ? `${API}/users/${editUser.id}` : `${API}/users`;
      const method = editUser ? "PUT" : "POST";
      const res    = await fetch(url,{method,headers:{"Content-Type":"application/json"},body:JSON.stringify(form)});
      const data   = await res.json();
      if (res.ok) { onToast(editUser?"User updated!":"User added!"); setShowForm(false); fetchUsers(); }
      else onToast(data.error||"Failed","error");
    } catch { onToast("Server error","error"); }
    setLoading(false);
  };

  const handleDelete = async (u) => {
    if (u.id===parseInt(uid())) { onToast("Cannot delete your own account","error"); return; }
    if (!window.confirm(`Delete "${u.full_name}"?`)) return;
    await fetch(`${API}/users/${u.id}`,{method:"DELETE"}).catch(()=>{});
    onToast("User deleted"); fetchUsers();
  };

  const ROLE_COLORS = {
    admin:{"bg":"#dcfce7","color":"#166534"}, manager:{"bg":"#fef3c7","color":"#92400e"},
    member:{"bg":"#dbeafe","color":"#1e40af"},
    "sales executive":{"bg":"#ede9fe","color":"#5b21b6"},
    "export manager":{"bg":"#fce7f3","color":"#9d174d"},
    "documentation officer":{"bg":"#ffedd5","color":"#c2410c"},
    accounts:{"bg":"#f0fdf4","color":"#15803d"},
    "warehouse manager":{"bg":"#f0f9ff","color":"#0369a1"},
  };

  return (
    <SectionCard icon={FiUsers} title="Users & Roles" subtitle="Manage team access" badge={!admin?"View Only":null}>
      {!admin && <ReadOnlyNotice/>}
      {admin && (
        <button className="set-add-user-btn" onClick={openAdd}><FiPlus size={14}/> Add New Member</button>
      )}
      {showForm && admin && (
        <div className="set-user-form">
          <div className="set-form-row">
            <Field label="Full Name *"><input placeholder="Full name" value={form.full_name} onChange={e=>setForm(p=>({...p,full_name:e.target.value}))}/></Field>
            <Field label="Username *"><input placeholder="username" value={form.username} onChange={e=>setForm(p=>({...p,username:e.target.value}))}/></Field>
          </div>
          <div className="set-form-row">
            <Field label={editUser?"New Password (blank = keep)":"Password *"}>
              <div className="set-input-wrap">
                <input type={showPass?"text":"password"} placeholder="Password" value={form.password} onChange={e=>setForm(p=>({...p,password:e.target.value}))}/>
                <button className="set-eye" onClick={()=>setShowPass(s=>!s)}>{showPass?<FiEyeOff size={14}/>:<FiEye size={14}/>}</button>
              </div>
            </Field>
            <Field label="Role *">
              <select value={form.role} onChange={e=>setForm(p=>({...p,role:e.target.value}))}>
                {["member","manager","sales executive","export manager","documentation officer","accounts","warehouse manager","admin"].map(r=><option key={r} value={r}>{r.charAt(0).toUpperCase()+r.slice(1)}</option>)}
              </select>
            </Field>
          </div>
          <div className="set-form-actions">
            <button className="set-cancel-btn" onClick={()=>setShowForm(false)}>Cancel</button>
            <SaveBtn onClick={handleSubmit} loading={loading} label={editUser?"Update Member":"Add Member"}/>
          </div>
        </div>
      )}
      <div className="set-user-list">
        {users.map(u => {
          const rc  = ROLE_COLORS[u.role?.toLowerCase()] || ROLE_COLORS.member;
          const isMe = u.id===parseInt(uid());
          return (
            <div className="set-user-row" key={u.id}>
              <div className="set-user-avatar">{u.full_name.split(" ").map(w=>w[0]).join("").toUpperCase().slice(0,2)}</div>
              <div className="set-user-info">
                <strong>{u.full_name}{isMe&&<span className="set-you-tag">You</span>}</strong>
                <span>@{u.username}</span>
              </div>
              <span className="set-role-badge" style={{background:rc.bg,color:rc.color}}>{u.role}</span>
              {admin && (
                <div className="set-user-actions">
                  <button className="set-icon-btn" onClick={()=>openEdit(u)}><FiEdit2 size={13}/></button>
                  {!isMe&&<button className="set-icon-btn set-icon-danger" onClick={()=>handleDelete(u)}><FiTrash2 size={13}/></button>}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </SectionCard>
  );
}

// =============================================================================
//  3. PRODUCT SETTINGS — category dropdown + expandable table
// =============================================================================
function ProductSettings({ onToast }) {
  const [categories, setCategories] = useState([]);
  const [products,   setProducts]   = useState([]);
  const [expanded,   setExpanded]   = useState(null);
  const [editRow,    setEditRow]    = useState(null);
  const [addRow,     setAddRow]     = useState(null);
  const [newCatName, setNewCatName] = useState("");
  const [showCatAdd, setShowCatAdd] = useState(false);
  const admin = isAdmin();

  const fetchCats  = () => fetch(`${API}/settings/product-categories`).then(r=>r.json()).then(d=>setCategories(Array.isArray(d)?d:[])).catch(()=>{});
  const fetchProds = (catId) => fetch(`${API}/settings/products?category_id=${catId}`).then(r=>r.json()).then(d=>setProducts(p=>({...p,[catId]:Array.isArray(d)?d:[]}))).catch(()=>{});

  useEffect(() => { fetchCats(); }, []);

  const toggleCategory = (id) => {
    if (expanded===id) { setExpanded(null); return; }
    setExpanded(id);
    if (!products[id]) fetchProds(id);
  };

  const handleAddCat = async () => {
    if (!newCatName.trim()) return;
    await fetch(`${API}/settings/product-categories`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name:newCatName})}).catch(()=>{});
    setNewCatName(""); setShowCatAdd(false); fetchCats(); onToast("Category added!");
  };

  const handleDeleteCat = async (id) => {
    if (!window.confirm("Delete this category and all its products?")) return;
    await fetch(`${API}/settings/product-categories/${id}`,{method:"DELETE"}).catch(()=>{});
    fetchCats(); setExpanded(null); onToast("Category deleted");
  };

  const EMPTY_PROD = { name:"", hs_code:"", unit:"MT", packaging:"PP Bags", selling_price:"", purchase_price:"", sku:"" };

  const handleSaveProd = async (catId) => {
    const body = {...addRow, category_id:catId};
    if (!body.name) { onToast("Product name required","error"); return; }
    await fetch(`${API}/settings/products`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)}).catch(()=>{});
    setAddRow(null); fetchProds(catId); onToast("Product added!");
  };

  const handleUpdateProd = async (catId) => {
    await fetch(`${API}/settings/products/${editRow.id}`,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify(editRow)}).catch(()=>{});
    setEditRow(null); fetchProds(catId); onToast("Product updated!");
  };

  const handleDeleteProd = async (id, catId) => {
    if (!window.confirm("Delete this product?")) return;
    await fetch(`${API}/settings/products/${id}`,{method:"DELETE"}).catch(()=>{});
    fetchProds(catId); onToast("Product deleted");
  };

  const UNITS = ["MT","KG","Quintal","Bags","Drums","Litres","Tons"];
  const PKGS  = ["PP Bags","Jute Bags","Bulk","Cartons","Drums","HDPE Bags"];

  return (
    <SectionCard icon={FiPackage} title="Product Catalogue" subtitle="Categories and products with pricing" badge={!admin?"View Only":null}>
      {!admin && <ReadOnlyNotice/>}

      {/* Category List */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
        <h4 className="set-sub-heading" style={{margin:0}}>Product Categories</h4>
        {admin && (
          <button className="set-add-user-btn" onClick={()=>setShowCatAdd(s=>!s)}><FiPlus size={13}/> Add Category</button>
        )}
      </div>

      {showCatAdd && admin && (
        <div style={{display:"flex",gap:8,marginBottom:14}}>
          <input value={newCatName} onChange={e=>setNewCatName(e.target.value)}
            placeholder="Category name (e.g. Grains)" style={{flex:1,padding:"8px 12px",borderRadius:8,border:"1px solid #d1d5db"}}
            onKeyDown={e=>e.key==="Enter"&&handleAddCat()}/>
          <SaveBtn onClick={handleAddCat} label="Add"/>
          <button className="set-cancel-btn" onClick={()=>setShowCatAdd(false)}>Cancel</button>
        </div>
      )}

      {categories.length === 0 && (
        <p style={{color:"#9ca3af",fontSize:13,textAlign:"center",padding:20}}>No categories yet. {admin?"Add one above.":""}</p>
      )}

      {categories.map(cat => (
        <div key={cat.id} style={{marginBottom:8,border:"1px solid #e5e7eb",borderRadius:10,overflow:"hidden"}}>
          {/* Category Header */}
          <div
            onClick={()=>toggleCategory(cat.id)}
            style={{
              display:"flex",alignItems:"center",justifyContent:"space-between",
              padding:"12px 16px",background:expanded===cat.id?"#0e2318":"#f9fafb",
              cursor:"pointer",userSelect:"none",transition:"background 0.2s"
            }}
          >
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              {expanded===cat.id ? <FiChevronDown size={16} color={expanded===cat.id?"#c9a96e":"#555"}/> : <FiChevronRight size={16} color="#555"/>}
              <span style={{fontWeight:700,fontSize:14,color:expanded===cat.id?"#c9a96e":"#0e2318"}}>{cat.name}</span>
              <span style={{fontSize:12,color:expanded===cat.id?"#c9a96e90":"#9ca3af"}}>
                {products[cat.id] ? `${products[cat.id].length} products` : ""}
              </span>
            </div>
            {admin && (
              <button
                className="set-icon-btn set-icon-danger"
                onClick={e=>{e.stopPropagation();handleDeleteCat(cat.id);}}
                style={{color:expanded===cat.id?"#fca5a5":"#ef4444"}}
              ><FiTrash2 size={12}/></button>
            )}
          </div>

          {/* Products Table */}
          {expanded===cat.id && (
            <div style={{overflowX:"auto"}}>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
                <thead>
                  <tr style={{background:"#f3f4f6"}}>
                    <th style={TH}>Product Name</th>
                    <th style={TH}>HS Code</th>
                    <th style={TH}>Unit</th>
                    <th style={TH}>Packaging</th>
                    <th style={TH}>Selling Price/MT</th>
                    {admin && <th style={TH}>Purchase Price/MT</th>}
                    <th style={TH}>SKU</th>
                    {admin && <th style={TH}>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {(products[cat.id]||[]).map((p,i) => (
                    editRow?.id===p.id ? (
                      <tr key={p.id} style={{background:"#fef9ec"}}>
                        <td style={TD}><input value={editRow.name} onChange={e=>setEditRow(r=>({...r,name:e.target.value}))} style={CELL_INPUT}/></td>
                        <td style={TD}><input value={editRow.hs_code||""} onChange={e=>setEditRow(r=>({...r,hs_code:e.target.value}))} style={CELL_INPUT}/></td>
                        <td style={TD}>
                          <select value={editRow.unit||"MT"} onChange={e=>setEditRow(r=>({...r,unit:e.target.value}))} style={{...CELL_INPUT,width:"auto"}}>
                            {UNITS.map(u=><option key={u}>{u}</option>)}
                          </select>
                        </td>
                        <td style={TD}>
                          <select value={editRow.packaging||""} onChange={e=>setEditRow(r=>({...r,packaging:e.target.value}))} style={{...CELL_INPUT,width:"auto"}}>
                            {PKGS.map(pk=><option key={pk}>{pk}</option>)}
                          </select>
                        </td>
                        <td style={TD}><input type="number" value={editRow.selling_price||""} onChange={e=>setEditRow(r=>({...r,selling_price:e.target.value}))} style={CELL_INPUT} placeholder="USD"/></td>
                        {admin && <td style={TD}><input type="number" value={editRow.purchase_price||""} onChange={e=>setEditRow(r=>({...r,purchase_price:e.target.value}))} style={CELL_INPUT} placeholder="USD"/></td>}
                        <td style={TD}><input value={editRow.sku||""} onChange={e=>setEditRow(r=>({...r,sku:e.target.value}))} style={CELL_INPUT}/></td>
                        <td style={TD}>
                          <button onClick={()=>handleUpdateProd(cat.id)} style={SAVE_BTN}><FiCheck size={12}/></button>
                          <button onClick={()=>setEditRow(null)} style={CANCEL_BTN}><FiX size={12}/></button>
                        </td>
                      </tr>
                    ) : (
                      <tr key={p.id} style={{background:i%2===0?"#fff":"#f9fafb",transition:"background 0.15s"}}>
                        <td style={{...TD,fontWeight:600}}>{p.name}</td>
                        <td style={TD}>{p.hs_code||"—"}</td>
                        <td style={TD}>{p.unit||"MT"}</td>
                        <td style={TD}>{p.packaging||"—"}</td>
                        <td style={TD}>{p.selling_price ? `$${parseFloat(p.selling_price).toLocaleString()}` : "—"}</td>
                        {admin && <td style={{...TD,color:"#c9a96e",fontWeight:600}}>{p.purchase_price ? `$${parseFloat(p.purchase_price).toLocaleString()}` : "—"}</td>}
                        <td style={TD}>{p.sku||"—"}</td>
                        {admin && (
                          <td style={TD}>
                            <button onClick={()=>setEditRow({...p})} style={EDIT_BTN}><FiEdit2 size={12}/></button>
                            <button onClick={()=>handleDeleteProd(p.id,cat.id)} style={DEL_BTN}><FiTrash2 size={12}/></button>
                          </td>
                        )}
                      </tr>
                    )
                  ))}
                  {/* Add Row */}
                  {admin && addRow?.catId===cat.id && (
                    <tr style={{background:"#f0fdf4"}}>
                      <td style={TD}><input value={addRow.name} onChange={e=>setAddRow(r=>({...r,name:e.target.value}))} style={CELL_INPUT} placeholder="Product name"/></td>
                      <td style={TD}><input value={addRow.hs_code||""} onChange={e=>setAddRow(r=>({...r,hs_code:e.target.value}))} style={CELL_INPUT} placeholder="1001.90"/></td>
                      <td style={TD}>
                        <select value={addRow.unit||"MT"} onChange={e=>setAddRow(r=>({...r,unit:e.target.value}))} style={{...CELL_INPUT,width:"auto"}}>
                          {UNITS.map(u=><option key={u}>{u}</option>)}
                        </select>
                      </td>
                      <td style={TD}>
                        <select value={addRow.packaging||""} onChange={e=>setAddRow(r=>({...r,packaging:e.target.value}))} style={{...CELL_INPUT,width:"auto"}}>
                          {PKGS.map(pk=><option key={pk}>{pk}</option>)}
                        </select>
                      </td>
                      <td style={TD}><input type="number" value={addRow.selling_price||""} onChange={e=>setAddRow(r=>({...r,selling_price:e.target.value}))} style={CELL_INPUT} placeholder="USD/MT"/></td>
                      <td style={TD}><input type="number" value={addRow.purchase_price||""} onChange={e=>setAddRow(r=>({...r,purchase_price:e.target.value}))} style={CELL_INPUT} placeholder="USD/MT"/></td>
                      <td style={TD}><input value={addRow.sku||""} onChange={e=>setAddRow(r=>({...r,sku:e.target.value}))} style={CELL_INPUT} placeholder="JOT-001"/></td>
                      <td style={TD}>
                        <button onClick={()=>handleSaveProd(cat.id)} style={SAVE_BTN}><FiCheck size={12}/></button>
                        <button onClick={()=>setAddRow(null)} style={CANCEL_BTN}><FiX size={12}/></button>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              {admin && (
                <div style={{padding:"10px 16px",borderTop:"1px solid #e5e7eb"}}>
                  {addRow?.catId===cat.id ? null : (
                    <button onClick={()=>setAddRow({...EMPTY_PROD,catId:cat.id})} style={{
                      background:"none",border:"1px dashed #c9a96e",color:"#c9a96e",
                      borderRadius:6,padding:"5px 12px",cursor:"pointer",fontSize:12,fontWeight:600
                    }}><FiPlus size={12}/> Add Product</button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </SectionCard>
  );
}

// ─── Table cell style constants ───────────────────────────────────────────────
const TH = { padding:"10px 12px", textAlign:"left", fontWeight:700, color:"#374151", fontSize:12, borderBottom:"2px solid #e5e7eb", whiteSpace:"nowrap" };
const TD = { padding:"9px 12px", borderBottom:"1px solid #f3f4f6", color:"#374151", verticalAlign:"middle" };
const CELL_INPUT = { width:"100%", padding:"5px 8px", border:"1px solid #d1d5db", borderRadius:6, fontSize:12, background:"#fff" };
const SAVE_BTN = { background:"#dcfce7",color:"#166534",border:"none",borderRadius:6,padding:"4px 8px",cursor:"pointer",marginRight:4,fontWeight:700 };
const CANCEL_BTN = { background:"#fee2e2",color:"#991b1b",border:"none",borderRadius:6,padding:"4px 8px",cursor:"pointer",fontWeight:700 };
const EDIT_BTN  = { background:"#dbeafe",color:"#1e40af",border:"none",borderRadius:6,padding:"4px 8px",cursor:"pointer",marginRight:4 };
const DEL_BTN   = { background:"#fee2e2",color:"#991b1b",border:"none",borderRadius:6,padding:"4px 8px",cursor:"pointer" };

// =============================================================================
//  4. SHIPPING SETTINGS — table format
// =============================================================================
function ShippingSettings({ onToast }) {
  const [data,    setData]    = useState({ method:[], incoterm:[], port:[], container:[] });
  const [editRow, setEditRow] = useState(null);
  const [addRow,  setAddRow]  = useState(null);
  const admin = isAdmin();

  const fetchAll = () => fetch(`${API}/settings/shipping`).then(r=>r.json()).then(d=>setData(d||{method:[],incoterm:[],port:[],container:[]})).catch(()=>{});
  useEffect(() => { fetchAll(); }, []);

  const handleSave = async (row) => {
    await fetch(`${API}/settings/shipping/${row.id}`,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify(row)}).catch(()=>{});
    setEditRow(null); fetchAll(); onToast("Row updated!");
  };

  const handleAdd = async (type) => {
    await fetch(`${API}/settings/shipping`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({type,...addRow})}).catch(()=>{});
    setAddRow(null); fetchAll(); onToast("Row added!");
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this row?")) return;
    await fetch(`${API}/settings/shipping/${id}`,{method:"DELETE"}).catch(()=>{});
    fetchAll(); onToast("Row deleted");
  };

  const SECTION_CONFIG = {
    method:    { title:"Shipping Methods",   cols:[{k:"col1",label:"Method"},{k:"col2",label:"Transit Time"},{k:"col3",label:"Carriers/Notes"}] },
    incoterm:  { title:"Incoterms",          cols:[{k:"col1",label:"Code"},{k:"col2",label:"Full Name"},{k:"col3",label:"Risk Transfer Point"}] },
    port:      { title:"Ports",              cols:[{k:"col1",label:"Port Name"},{k:"col2",label:"UNLOCODE"},{k:"col3",label:"Type (loading/discharge)"},{k:"col4",label:"Location"}] },
    container: { title:"Container Types",   cols:[{k:"col1",label:"Type"},{k:"col2",label:"Capacity"},{k:"col3",label:"Max Weight"},{k:"col4",label:"Notes"}] },
  };

  return (
    <SectionCard icon={FiTruck} title="Shipping & Logistics" subtitle="Methods, incoterms, ports and containers" badge={!admin?"View Only":null}>
      {!admin && <ReadOnlyNotice/>}
      {Object.entries(SECTION_CONFIG).map(([type, cfg]) => (
        <div key={type} style={{marginBottom:24}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
            <h4 className="set-sub-heading" style={{margin:0}}>{cfg.title}</h4>
            {admin && (
              <button className="set-add-user-btn" style={{fontSize:11,padding:"5px 12px"}}
                onClick={()=>setAddRow(addRow?.type===type?null:{type,col1:"",col2:"",col3:"",col4:""})}>
                <FiPlus size={11}/> Add Row
              </button>
            )}
          </div>
          <div style={{border:"1px solid #e5e7eb",borderRadius:10,overflow:"hidden"}}>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
              <thead>
                <tr style={{background:"#0e2318"}}>
                  {cfg.cols.map(c=><th key={c.k} style={{...TH,color:"#c9a96e",background:"transparent"}}>{c.label}</th>)}
                  {admin && <th style={{...TH,color:"#c9a96e",background:"transparent"}}>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {(data[type]||[]).map((row,i) => (
                  editRow?.id===row.id ? (
                    <tr key={row.id} style={{background:"#fef9ec"}}>
                      {cfg.cols.map(c=>(
                        <td key={c.k} style={TD}>
                          <input value={editRow[c.k]||""} onChange={e=>setEditRow(r=>({...r,[c.k]:e.target.value}))} style={CELL_INPUT}/>
                        </td>
                      ))}
                      <td style={TD}>
                        <button onClick={()=>handleSave(editRow)} style={SAVE_BTN}><FiCheck size={12}/></button>
                        <button onClick={()=>setEditRow(null)} style={CANCEL_BTN}><FiX size={12}/></button>
                      </td>
                    </tr>
                  ) : (
                    <tr key={row.id} style={{background:i%2===0?"#fff":"#f9fafb"}}>
                      {cfg.cols.map(c=><td key={c.k} style={TD}>{row[c.k]||"—"}</td>)}
                      {admin && (
                        <td style={TD}>
                          <button onClick={()=>setEditRow({...row})} style={EDIT_BTN}><FiEdit2 size={12}/></button>
                          <button onClick={()=>handleDelete(row.id)} style={DEL_BTN}><FiTrash2 size={12}/></button>
                        </td>
                      )}
                    </tr>
                  )
                ))}
                {admin && addRow?.type===type && (
                  <tr style={{background:"#f0fdf4"}}>
                    {cfg.cols.map(c=>(
                      <td key={c.k} style={TD}>
                        <input value={addRow[c.k]||""} onChange={e=>setAddRow(r=>({...r,[c.k]:e.target.value}))} style={CELL_INPUT} placeholder={c.label}/>
                      </td>
                    ))}
                    <td style={TD}>
                      <button onClick={()=>handleAdd(type)} style={SAVE_BTN}><FiCheck size={12}/></button>
                      <button onClick={()=>setAddRow(null)} style={CANCEL_BTN}><FiX size={12}/></button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </SectionCard>
  );
}

// =============================================================================
//  5. NOTIFICATIONS
// =============================================================================
function NotificationSettings({ onToast }) {
  const [cfg,     setCfg]     = useState(null);
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const admin = isAdmin();

  useEffect(() => {
    fetch(`${API}/settings/notifications`).then(r=>r.json())
      .then(d => setCfg({
        smtp_host:"", smtp_port:587, smtp_secure:false, smtp_user:"", smtp_pass:"",
        sender_name:"CRM Notifications", receivers:[],
        notify_events:true, notify_orders:true, notify_shipments:true,
        notify_payments:true, notify_due_dates:true,
        ...d
      })).catch(()=>{});
  }, []);

  const set = (k,v) => setCfg(p=>({...p,[k]:v}));

  const addReceiver = () => {
    if (!newEmail || !newEmail.includes("@")) { onToast("Enter a valid email","error"); return; }
    if (cfg.receivers.includes(newEmail)) { onToast("Already added","error"); return; }
    setCfg(p=>({...p, receivers:[...p.receivers, newEmail]}));
    setNewEmail("");
  };

  const removeReceiver = (email) => setCfg(p=>({...p, receivers:p.receivers.filter(e=>e!==email)}));

  const handleSave = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/settings/notifications`,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify(cfg)});
      if (res.ok) onToast("Notification settings saved!");
      else { const e=await res.json(); onToast(e.error||"Failed","error"); }
    } catch { onToast("Server error","error"); }
    setLoading(false);
  };

  const handleTest = async () => {
    // Save first, then test
    await fetch(`${API}/settings/notifications`,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify(cfg)}).catch(()=>{});
    setTesting(true);
    try {
      const res = await fetch(`${API}/settings/notifications/test`,{method:"POST"});
      const d = await res.json();
      if (res.ok) onToast(d.message||"Test email sent!");
      else onToast(d.error||"Failed to send","error");
    } catch { onToast("Server error","error"); }
    setTesting(false);
  };

  if (!cfg) return <div style={{padding:20,color:"#9ca3af"}}>Loading…</div>;

  const toggleCfg = { notify_events:"Upcoming Events" };

  return (
    <SectionCard icon={FiBell} title="Notifications" subtitle="Email alerts and notification settings" badge={!admin?"View Only":null}>
      {!admin && <ReadOnlyNotice/>}

      {/* SMTP Config */}
      <h4 className="set-sub-heading">📧 Email (SMTP) Configuration</h4>
      <div className="set-form-grid-3">
        <Field label="SMTP Host">
          <input value={cfg.smtp_host||""} onChange={e=>set("smtp_host",e.target.value)} placeholder="smtp.gmail.com" disabled={!admin}/>
        </Field>
        <Field label="SMTP Port">
          <input type="number" value={cfg.smtp_port||587} onChange={e=>set("smtp_port",parseInt(e.target.value))} disabled={!admin}/>
        </Field>
        <Field label="SMTP Username">
          <input value={cfg.smtp_user||""} onChange={e=>set("smtp_user",e.target.value)} placeholder="your@gmail.com" disabled={!admin}/>
        </Field>
        <Field label="SMTP Password">
          <input type="password" value={cfg.smtp_pass||""} onChange={e=>set("smtp_pass",e.target.value)} placeholder="App password" disabled={!admin}/>
        </Field>
        <Field label="Sender Name">
          <input value={cfg.sender_name||""} onChange={e=>set("sender_name",e.target.value)} placeholder="Western Agro CRM" disabled={!admin}/>
        </Field>
        <Field label="Use TLS/SSL">
          <label style={{display:"flex",alignItems:"center",gap:8,marginTop:8,cursor:admin?"pointer":"not-allowed"}}>
            <input type="checkbox" checked={!!cfg.smtp_secure} onChange={e=>admin&&set("smtp_secure",e.target.checked)}/>
            Enable secure connection (port 465)
          </label>
        </Field>
      </div>

      {/* Receiver Emails */}
      <h4 className="set-sub-heading" style={{marginTop:20}}>📬 Receiver Emails</h4>
      <p style={{fontSize:12,color:"#9ca3af",marginBottom:10}}>Add email addresses that will receive all notifications.</p>
      {cfg.receivers.map(email => (
        <div key={email} style={{display:"flex",alignItems:"center",gap:10,marginBottom:6}}>
          <span style={{flex:1,background:"#f9fafb",border:"1px solid #e5e7eb",borderRadius:8,padding:"8px 12px",fontSize:13}}>
            <FiMail size={12} style={{marginRight:6,color:"#9ca3af"}}/>{email}
          </span>
          {admin && (
            <button onClick={()=>removeReceiver(email)} style={{...DEL_BTN,padding:"7px 10px"}}><FiX size={13}/></button>
          )}
        </div>
      ))}
      {admin && (
        <div style={{display:"flex",gap:8,marginTop:8}}>
          <input
            value={newEmail} onChange={e=>setNewEmail(e.target.value)}
            placeholder="receiver@email.com" style={{flex:1,padding:"8px 12px",border:"1px solid #d1d5db",borderRadius:8,fontSize:13}}
            onKeyDown={e=>e.key==="Enter"&&addReceiver()}
          />
          <button onClick={addReceiver} style={{...SAVE_BTN,padding:"8px 14px",fontSize:13,display:"flex",alignItems:"center",gap:6}}>
            <FiPlus size={13}/> Add
          </button>
        </div>
      )}

      {/* Alert Types */}
      <h4 className="set-sub-heading" style={{marginTop:20}}>🔔 Alert Types</h4>
      {Object.entries(toggleCfg).map(([k, label]) => (
        <Toggle key={k} value={!!cfg[k]} onChange={v=>admin&&set(k,v)} label={label} disabled={!admin}/>
      ))}

      {admin && (
        <div className="set-form-actions" style={{marginTop:20}}>
          <button
            onClick={handleTest} disabled={testing}
            style={{
              background:"#0e2318",color:"#c9a96e",border:"none",borderRadius:8,
              padding:"10px 20px",cursor:"pointer",fontWeight:700,fontSize:13,
              display:"flex",alignItems:"center",gap:8
            }}
          >
            <FiSend size={14}/> {testing?"Sending…":"Send Test Email"}
          </button>
          <SaveBtn onClick={handleSave} loading={loading}/>
        </div>
      )}
    </SectionCard>
  );
}

// =============================================================================
//  6. SECURITY SETTINGS
// =============================================================================
function SecuritySettings({ onToast }) {
  const [cfg,     setCfg]     = useState({ session_timeout_min:60, two_factor_enabled:false });
  const [history, setHistory] = useState([]);
  const [sessions, setSessions] = useState(null);
  const [qr,      setQr]      = useState(null);
  const [otp,     setOtp]     = useState("");
  const [loading, setLoading] = useState(false);
  const admin = isAdmin();

  useEffect(() => {
    fetch(`${API}/settings/security`).then(r=>r.json()).then(d=>setCfg(d||{session_timeout_min:60,two_factor_enabled:false})).catch(()=>{});
    fetch(`${API}/settings/login-history`).then(r=>r.json()).then(d=>setHistory(Array.isArray(d)?d:[])).catch(()=>{});
    if (admin) {
      fetch(`${API}/settings/sessions`).then(r=>r.json()).then(d=>setSessions(Array.isArray(d)?d:[])).catch(()=>{});
    }
  }, [admin]);
  const handleLogoutDevice = async (id) => {
    if (!window.confirm("Are you sure you want to log out this device?")) return;
    try {
      const res = await fetch(`${API}/settings/sessions/${id}`, { method: "DELETE" });
      if (res.ok) {
        onToast("Device logged out");
        setSessions(s => (s || []).filter(x => x.id !== id));
      } else onToast("Failed to logout device", "error");
    } catch { onToast("Server error", "error"); }
  };

  const handleLogoutAllDevices = async () => {
    if (!window.confirm("Are you sure you want to log out ALL other devices?")) return;
    try {
      const res = await fetch(`${API}/settings/sessions/all`, { method: "DELETE" });
      if (res.ok) {
        onToast("All other devices logged out");
        fetch(`${API}/settings/sessions`).then(r=>r.json()).then(d=>setSessions(Array.isArray(d)?d:[]));
      } else onToast("Failed to logout devices", "error");
    } catch { onToast("Server error", "error"); }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/settings/security`,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify(cfg)});
      if (res.ok) onToast("Security settings saved!");
      else onToast("Failed to save","error");
    } catch { onToast("Server error","error"); }
    setLoading(false);
  };

  const handleGenerate2FA = async () => {
    try {
      const res = await fetch(`${API}/settings/2fa/generate`,{method:"POST"});
      const d = await res.json();
      if (d.secret) {
        setQr(d.qr);
        onToast("2FA Secret Generated!");
      }
    } catch { onToast("Server error","error"); }
  };

  const handleVerify2FA = async () => {
    if (!otp) return onToast("Enter 6-digit OTP","error");
    try {
      const res = await fetch(`${API}/settings/2fa/verify`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({token:otp})});
      if (res.ok) {
        setCfg(c=>({...c,two_factor_enabled:true}));
        setQr(null);
        setOtp("");
        onToast("2FA Enabled Successfully!");
      } else {
        const err = await res.json();
        onToast(err.error||"Invalid OTP","error");
      }
    } catch { onToast("Server error","error"); }
  };

  const STATUS_COLORS = { login_success:{ bg:"#dcfce7",color:"#166534" }, login_failed:{ bg:"#fee2e2",color:"#991b1b" } };

  return (
    <>
      <SectionCard icon={FiShield} title="Security Settings" subtitle="Session timeout, 2FA and login controls" badge={!admin?"View Only":null}>
        {!admin && <ReadOnlyNotice/>}

        {admin && (
          <div style={{marginBottom:24}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
              <h4 className="set-sub-heading" style={{margin:0}}>Active Logins</h4>
              <button onClick={handleLogoutAllDevices} style={{background:"#fee2e2",color:"#991b1b",border:"none",padding:"6px 12px",borderRadius:6,fontSize:12,fontWeight:600,cursor:"pointer"}}>
                Logout ALL devices
              </button>
            </div>
            <div style={{border:"1px solid #e5e7eb",borderRadius:8,overflow:"hidden"}}>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
                <thead>
                  <tr style={{background:"#f9fafb",borderBottom:"1px solid #e5e7eb",textAlign:"left"}}>
                    <th style={{padding:"8px 12px",color:"#6b7280"}}>User</th>
                    <th style={{padding:"8px 12px",color:"#6b7280"}}>IP Address</th>
                    <th style={{padding:"8px 12px",color:"#6b7280"}}>Device</th>
                    <th style={{padding:"8px 12px",color:"#6b7280"}}>Last Active</th>
                    <th style={{padding:"8px 12px"}}></th>
                  </tr>
                </thead>
                <tbody>
                  {sessions === null && <tr><td colSpan={5} style={{textAlign:"center",padding:20}}>Loading active sessions...</td></tr>}
                  {sessions !== null && sessions.length === 0 && <tr><td colSpan={5} style={{textAlign:"center",padding:20}}>No active sessions found (Have you logged out and back in?)</td></tr>}
                  {sessions !== null && sessions.map(s => (
                    <tr key={s.id} style={{borderBottom:"1px solid #f3f4f6"}}>
                      <td style={{padding:"8px 12px",fontWeight:600}}>{s.username}</td>
                      <td style={{padding:"8px 12px",color:"#4b5563"}}>{s.ip_address}</td>
                      <td style={{padding:"8px 12px",color:"#4b5563",maxWidth:200,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}} title={s.user_agent}>{s.user_agent}</td>
                      <td style={{padding:"8px 12px",color:"#4b5563"}}>{new Date(s.last_activity).toLocaleString()}</td>
                      <td style={{padding:"8px 12px",textAlign:"right"}}>
                        <button onClick={()=>handleLogoutDevice(s.id)} style={{background:"transparent",color:"#ef4444",border:"1px solid #fee2e2",padding:"4px 8px",borderRadius:4,fontSize:11,cursor:"pointer"}}>Logout</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 2FA */}
        <h4 className="set-sub-heading"><FiKey size={13} style={{marginRight:6}}/>Two-Factor Authentication (TOTP)</h4>
        <div style={{
          background: cfg.two_factor_enabled ? "#dcfce7" : "#f9fafb",
          border:`1px solid ${cfg.two_factor_enabled?"#86efac":"#e5e7eb"}`,
          borderRadius:10, padding:16, marginBottom:16
        }}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <div>
              <strong style={{fontSize:14,color:cfg.two_factor_enabled?"#166534":"#374151"}}>
                {cfg.two_factor_enabled ? "✅ 2FA is ENABLED" : "2FA is currently disabled"}
              </strong>
              <p style={{fontSize:12,color:"#9ca3af",margin:"4px 0 0"}}>
                Uses TOTP (Google Authenticator, Authy etc.)
              </p>
            </div>
            {admin && !cfg.two_factor_enabled && (
              <button onClick={handleGenerate2FA} style={{
                background:"#0e2318",color:"#c9a96e",border:"none",borderRadius:8,
                padding:"8px 16px",cursor:"pointer",fontWeight:700,fontSize:12
              }}>Setup 2FA</button>
            )}
          </div>

          {qr && admin && (
            <div style={{textAlign:"center",marginTop:16}}>
              <p style={{fontSize:13,color:"#374151",marginBottom:10}}>
                Scan this QR code with Google Authenticator or Authy, then enter the 6-digit code below:
              </p>
              <img src={qr} alt="QR Code" style={{width:180,height:180,border:"4px solid #e5e7eb",borderRadius:8}}/>
              <div style={{display:"flex",gap:8,justifyContent:"center",marginTop:12}}>
                <input value={otp} onChange={e=>setOtp(e.target.value)} maxLength={6}
                  placeholder="Enter 6-digit code" style={{...CELL_INPUT,maxWidth:180,textAlign:"center",fontSize:18,letterSpacing:4}}/>
                <button onClick={handleVerify2FA} style={{...SAVE_BTN,padding:"8px 16px",fontSize:13}}>Verify & Enable</button>
              </div>
            </div>
          )}
        </div>

        {admin && (
          <div className="set-form-actions">
            <SaveBtn onClick={handleSave} loading={loading}/>
          </div>
        )}
      </SectionCard>

      {/* Login History */}
      <SectionCard icon={FiClock} title="Login History" subtitle="Recent login attempts (last 100)">
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
            <thead>
              <tr style={{background:"#0e2318"}}>
                {["Date & Time","Username","IP Address","Browser/Device","Status"].map(h=>(
                  <th key={h} style={{...TH,color:"#c9a96e",background:"transparent"}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {history.length===0 && (
                <tr><td colSpan={5} style={{textAlign:"center",padding:20,color:"#9ca3af"}}>No login history yet</td></tr>
              )}
              {history.map((row,i) => {
                const sc = STATUS_COLORS[row.event_type] || STATUS_COLORS.login_success;
                return (
                  <tr key={row.id} style={{background:i%2===0?"#fff":"#f9fafb"}}>
                    <td style={TD}>{new Date(row.created_at).toLocaleString()}</td>
                    <td style={{...TD,fontWeight:600}}>{row.username}</td>
                    <td style={TD}>{row.ip_address}</td>
                    <td style={{...TD,maxWidth:220,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                      <span title={row.user_agent}>{(row.user_agent||"").substring(0,40)}{(row.user_agent||"").length>40?"…":""}</span>
                    </td>
                    <td style={TD}>
                      <span style={{background:sc.bg,color:sc.color,padding:"2px 10px",borderRadius:20,fontSize:11,fontWeight:700}}>
                        {row.event_type}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </>
  );
}

// =============================================================================
//  7. CHANGE PASSWORD
// =============================================================================
function ChangePassword({ onToast }) {
  const [form, setForm] = useState({ current:"", newPass:"", confirm:"" });
  const [show, setShow] = useState({ current:false, newPass:false, confirm:false });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!form.current||!form.newPass||!form.confirm) { onToast("Fill all fields","error"); return; }
    if (form.newPass.length<4) { onToast("Min 4 characters","error"); return; }
    if (form.newPass!==form.confirm) { onToast("Passwords don't match","error"); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API}/users/${uid()}/password`,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({current_password:form.current,new_password:form.newPass})});
      const d = await res.json();
      if (res.ok) { onToast("Password updated!"); setForm({current:"",newPass:"",confirm:""}); }
      else onToast(d.error||"Failed","error");
    } catch { onToast("Server error","error"); }
    setLoading(false);
  };

  const PwField = ({label,field,placeholder}) => (
    <Field label={label}>
      <div className="set-input-wrap">
        <input type={show[field]?"text":"password"} placeholder={placeholder}
          value={form[field]} onChange={e=>setForm(p=>({...p,[field]:e.target.value}))}/>
        <button className="set-eye" onClick={()=>setShow(s=>({...s,[field]:!s[field]}))}>
          {show[field]?<FiEyeOff size={14}/>:<FiEye size={14}/>}
        </button>
      </div>
    </Field>
  );

  return (
    <SectionCard icon={FiLock} title="Change Password" subtitle="Update your login password">
      <PwField label="Current Password" field="current" placeholder="Current password"/>
      <PwField label="New Password" field="newPass" placeholder="Min 4 characters"/>
      <PwField label="Confirm Password" field="confirm" placeholder="Confirm new password"/>
      <div className="set-form-actions">
        <SaveBtn onClick={handleSubmit} loading={loading} label="Update Password"/>
      </div>
    </SectionCard>
  );
}

// =============================================================================
//  8. PERMISSIONS TABLE — updated
// =============================================================================
function RolePermissions() {
  const rows = [
    { feature:"Dashboard",              admin:true,  manager:true,  member:true  },
    { feature:"Calendar",               admin:true,  manager:true,  member:true  },
    { feature:"Inquiries",              admin:true,  manager:true,  member:true  },
    { feature:"Seller Inquiries",       admin:true,  manager:true,  member:true  },
    { feature:"Buyers",                 admin:true,  manager:true,  member:true  },
    { feature:"Sellers",                admin:true,  manager:true,  member:true  },
    { feature:"Accounts",               admin:true,  manager:true,  member:false },
    { feature:"Companies",              admin:true,  manager:true,  member:false },
    { feature:"Documents",              admin:true,  manager:true,  member:false },
    { feature:"Analytics",              admin:true,  manager:true,  member:false },
    { feature:"Products",               admin:true,  manager:true,  member:true  },
    { feature:"Messages",               admin:true,  manager:true,  member:true  },
    { feature:"Settings (view)",        admin:true,  manager:true,  member:true  },
    { feature:"Settings (edit)",        admin:true,  manager:false, member:false },
    { feature:"Delete records",         admin:true,  manager:false, member:false },
    { feature:"Manage team",            admin:true,  manager:false, member:false },
    { feature:"Company settings",       admin:true,  manager:false, member:false },
    { feature:"Product catalogue edit", admin:true,  manager:false, member:false },
    { feature:"Shipping settings edit", admin:true,  manager:false, member:false },
    { feature:"Notification settings",  admin:true,  manager:false, member:false },
    { feature:"Security settings",      admin:true,  manager:false, member:false },
    { feature:"Login history (view)",   admin:true,  manager:false, member:false },
    { feature:"View selling price",     admin:true,  manager:true,  member:true  },
    { feature:"View purchase price",    admin:true,  manager:false, member:false },
  ];

  const Tick = ({v}) => v
    ? <span style={{color:"#16a34a",fontWeight:700,fontSize:16}}>✓</span>
    : <span style={{color:"#dc2626",fontWeight:700,fontSize:16}}>✗</span>;

  return (
    <SectionCard icon={FiShield} title="Role Permissions" subtitle="Access control overview for all roles" noPad>
      <div className="set-perm-table-wrap">
        <table className="set-perm-table">
          <thead>
            <tr>
              <th>Feature / Permission</th>
              <th>Admin</th>
              <th>Manager</th>
              <th>Member</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r=>(
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
  { id:"company",       label:"Company",        icon:FiBriefcase,  roles:["admin","manager","member"] },
  { id:"password",      label:"Password",       icon:FiLock,       roles:["admin","manager","member"] },
  { id:"team",          label:"Users & Roles",  icon:FiUsers,      roles:["admin","manager","member"] },
  { id:"product",       label:"Products",       icon:FiPackage,    roles:["admin","manager","member"] },
  { id:"shipping",      label:"Shipping",       icon:FiTruck,      roles:["admin","manager","member"] },
  { id:"notifications", label:"Notifications",  icon:FiBell,       roles:["admin","manager","member"] },
  { id:"security",      label:"Security",       icon:FiShield,     roles:["admin","manager","member"] },
  { id:"permissions",   label:"Permissions",    icon:FiSettings,   roles:["admin","manager","member"] },
];

function Settings() {
  const userRole    = getRole();
  const [toast, setToast]       = useState(null);
  const visibleTabs = TABS.filter(t => t.roles.includes(userRole));
  const [activeTab, setActiveTab] = useState(visibleTabs[0]?.id || "company");

  const showToast = (msg, type = "success") => setToast({ msg, type });

  const CONTENT = {
    company:       <CompanySettings      onToast={showToast}/>,
    password:      <ChangePassword       onToast={showToast}/>,
    team:          <TeamMembers          onToast={showToast}/>,
    product:       <ProductSettings      onToast={showToast}/>,
    shipping:      <ShippingSettings     onToast={showToast}/>,
    notifications: <NotificationSettings onToast={showToast}/>,
    security:      <SecuritySettings     onToast={showToast}/>,
    permissions:   <RolePermissions/>,
  };

  return (
    <div className="set-page">
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={()=>setToast(null)}/>}

      <div className="set-page-header">
        <div>
          <h1 className="jot-title">Settings</h1>
          <p className="jot-subtitle">
            Manage your CRM, team and preferences
            {!isAdmin() && <span style={{marginLeft:10,fontSize:12,color:"#f59e0b",fontWeight:600}}>👁 View-only mode</span>}
          </p>
        </div>
      </div>

      <div className="set-layout">
        <div className="set-tabs">
          <div className="set-tabs-label">General</div>
          {visibleTabs.filter(t => ["company", "password", "team"].includes(t.id)).map(t => (
            <button
              key={t.id}
              className={`set-tab ${activeTab===t.id?"set-tab-active":""}`}
              onClick={()=>setActiveTab(t.id)}
            >
              <t.icon size={15}/> {t.label}
            </button>
          ))}
          
          <div className="set-tabs-divider" />
          <div className="set-tabs-label">Operations</div>
          {visibleTabs.filter(t => ["product", "shipping"].includes(t.id)).map(t => (
            <button
              key={t.id}
              className={`set-tab ${activeTab===t.id?"set-tab-active":""}`}
              onClick={()=>setActiveTab(t.id)}
            >
              <t.icon size={15}/> {t.label}
            </button>
          ))}

          <div className="set-tabs-divider" />
          <div className="set-tabs-label">System</div>
          {visibleTabs.filter(t => ["notifications", "security", "permissions"].includes(t.id)).map(t => (
            <button
              key={t.id}
              className={`set-tab ${activeTab===t.id?"set-tab-active":""}`}
              onClick={()=>setActiveTab(t.id)}
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