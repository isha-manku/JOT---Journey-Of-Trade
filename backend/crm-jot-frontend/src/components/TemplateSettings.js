import React, { useState, useEffect, useCallback } from 'react';
import { FiFileText, FiPlus, FiRefreshCw, FiEye, FiEdit2, FiLock, FiTrash2 } from 'react-icons/fi';
import SchemaEditorModal from './SchemaEditorModal';

const API = "http://localhost:5000";
const uid    = () => localStorage.getItem("userId");
const getRole = () => localStorage.getItem("role");
const isAdmin = () => getRole() === "admin";

const SectionCard = ({ icon:Icon, title, subtitle, badge, children }) => (
  <div style={{ background:"#fff", borderRadius:12, boxShadow:"0 2px 10px rgba(0,0,0,0.04)", border:"1px solid #f3f4f6", marginBottom:24, overflow:"hidden" }}>
    <div style={{ padding:"20px 24px", borderBottom:"1px solid #f3f4f6", display:"flex", alignItems:"center", justifyContent:"space-between", background:"#fafafa" }}>
      <div style={{display:"flex", alignItems:"center", gap:14}}>
        <div style={{background:"#ecfdf5", padding:10, borderRadius:10, color:"#10b981", display:"flex"}}><Icon size={20}/></div>
        <div>
          <h3 style={{margin:0, fontSize:16, fontWeight:600, color:"#0e2318"}}>{title}</h3>
          {subtitle && <p style={{margin:"4px 0 0", fontSize:13, color:"#6b7280"}}>{subtitle}</p>}
        </div>
      </div>
      {badge && <span style={{background:"#f3f4f6", color:"#4b5563", padding:"4px 10px", borderRadius:20, fontSize:12, fontWeight:500}}>{badge}</span>}
    </div>
    <div style={{padding:24}}>{children}</div>
  </div>
);

const Field = ({ label, children }) => (
  <div style={{display:"flex", flexDirection:"column", gap:6}}>
    <label style={{fontSize:13, fontWeight:600, color:"#374151"}}>{label}</label>
    {children}
  </div>
);

const ReadOnlyNotice = () => (
  <div style={{background:"#fffbeb", border:"1px solid #fde68a", color:"#92400e", padding:"12px 16px", borderRadius:8, marginBottom:20, fontSize:13, display:"flex", alignItems:"center", gap:10}}>
    <FiLock size={16}/> You do not have permission to edit these settings.
  </div>
);

const EDIT_BTN = { background:"none", border:"none", color:"#3b82f6", cursor:"pointer", padding:"6px 12px", borderRadius:6, fontSize:13, fontWeight:500 };

export default function TemplateSettings({ onToast }) {
  const admin = isAdmin();
  const [templates, setTemplates] = useState([]);
  const [schemaEditorId, setSchemaEditorId] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ name: "", company_name: "", product_name: "", document_type_name: "", file: null });

  const handleAddTemplate = async () => {
    if (!addForm.name || !addForm.company_name || !addForm.product_name || !addForm.document_type_name) {
      onToast("All fields are required", "error");
      return;
    }
    if (!addForm.file) {
      onToast("Please select a DOCX template file", "error");
      return;
    }
    try {
      const res = await fetch(`${API}/settings/templates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(addForm)
      });
      if (res.ok) {
        const data = await res.json();
        const newTemplateId = data.id || (data.template && data.template.id);
        if (!newTemplateId) {
          onToast("Template added successfully, but ID was missing. Please upload DOCX manually.", "error");
          fetchTemplates();
          return;
        }

        onToast("Template metadata saved. Uploading DOCX...");
        const formData = new FormData();
        formData.append("file", addForm.file);
        
        const uploadRes = await fetch(`${API}/settings/templates/${newTemplateId}/upload-docx`, {
          method: "POST",
          body: formData
        });
        
        if (uploadRes.ok) {
          onToast("Template and DOCX uploaded successfully!");
          setShowAdd(false);
          setAddForm({ name: "", company_name: "", product_name: "", document_type_name: "", file: null });
          fetchTemplates();
          handleOpenSchemaEditor(newTemplateId);
        } else {
          const errData = await uploadRes.json();
          onToast(errData.error || "Failed to upload DOCX file", "error");
        }
      } else {
        const d = await res.json();
        onToast(d.error || "Failed to add template", "error");
      }
    } catch {
      onToast("Server error", "error");
    }
  };

  const handleUploadDocx = async (e, id) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    onToast("Uploading DOCX...");
    try {
      const res = await fetch(`${API}/settings/templates/${id}/upload-docx`, {
        method: "POST", body: formData
      });
      if (res.ok) {
        onToast("DOCX uploaded successfully!");
        fetchTemplates();
        handleOpenSchemaEditor(id);
      } else {
        const d = await res.json();
        onToast(d.error || "Failed to upload DOCX", "error");
      }
    } catch {
      onToast("Server error during upload", "error");
    }
  };

  const handleDeleteTemplate = async (id) => {
    if(!window.confirm("Are you sure you want to delete this template?")) return;
    try {
      const res = await fetch(`${API}/settings/templates/${id}`, { method: 'DELETE' });
      if (res.ok) {
        onToast("Template deleted successfully!");
        fetchTemplates();
      } else {
        const d = await res.json();
        onToast(d.error || "Failed to delete template", "error");
      }
    } catch {
      onToast("Server error", "error");
    }
  };

  const fetchTemplates = useCallback(() => {
    fetch(`${API}/settings/templates`)
      .then(r => r.json())
      .then(d => {
        if (Array.isArray(d)) setTemplates(d);
      }).catch(()=>{});
  }, []);

  useEffect(() => { fetchTemplates(); }, [fetchTemplates]);

  const handleOpenSchemaEditor = (id) => {
    setSchemaEditorId(id);
  };

  return (
    <>
      <SectionCard icon={FiFileText} title="Document Templates" subtitle="Manage document templates and forms" badge={!admin?"View Only":null}>
        {!admin && <ReadOnlyNotice/>}
        
        {admin && (
          <div style={{display:"flex",justifyContent:"flex-end",marginBottom:14}}>
            <button className="set-add-user-btn" onClick={() => setShowAdd(s=>!s)} style={{background: '#10b981', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600}}>
              <FiPlus size={16}/> Add Template
            </button>
          </div>
        )}

        {showAdd && admin && (
          <div style={{background:"#f9fafb",border:"1px solid #e5e7eb",borderRadius:10,padding:20,marginBottom:20}}>
            <h4 style={{margin:"0 0 14px",color:"#0e2318",fontSize:14}}>New Template</h4>
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px'}}>
              <Field label="Template Name">
                <input value={addForm.name} onChange={e=>setAddForm(p=>({...p, name:e.target.value}))} placeholder="e.g. Master FCO" style={{padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px'}}/>
              </Field>
              <Field label="Company Name">
                <input value={addForm.company_name} onChange={e=>setAddForm(p=>({...p, company_name:e.target.value}))} placeholder="e.g. Acme Corp" style={{padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px'}}/>
              </Field>
              <Field label="Product Name">
                <input value={addForm.product_name} onChange={e=>setAddForm(p=>({...p, product_name:e.target.value}))} placeholder="e.g. Frozen Chicken Paws" style={{padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px'}}/>
              </Field>
              <Field label="Document Type">
                <input value={addForm.document_type_name} onChange={e=>setAddForm(p=>({...p, document_type_name:e.target.value}))} placeholder="e.g. Sales Contract" style={{padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px'}}/>
              </Field>
              <Field label="Template File (.docx)">
                <input type="file" accept=".docx" onChange={e=>setAddForm(p=>({...p, file:e.target.files[0]}))} style={{padding: '5px', background: '#fff', border: '1px solid #d1d5db', borderRadius: '6px'}} />
              </Field>
            </div>
            <div style={{display:"flex",justifyContent:"flex-end",gap:10,marginTop:16}}>
              <button onClick={()=>setShowAdd(false)} style={{background: 'none', border: '1px solid #d1d5db', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, color: '#374151'}}>Cancel</button>
              <button onClick={handleAddTemplate} style={{background: '#10b981', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 600}}>Save Template</button>
            </div>
          </div>
        )}

        <div style={{overflowX: 'auto'}}>
          <table style={{width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px'}}>
            <thead>
              <tr style={{borderBottom: '1px solid #e5e7eb'}}>
                <th style={{padding: '12px 16px', color: '#6b7280', fontWeight: 600}}>Name</th>
                <th style={{padding: '12px 16px', color: '#6b7280', fontWeight: 600}}>Taxonomy</th>
                <th style={{padding: '12px 16px', color: '#6b7280', fontWeight: 600}}>Status</th>
                {admin && <th style={{padding: '12px 16px', color: '#6b7280', fontWeight: 600, textAlign: 'right'}}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {templates.length === 0 && (
                <tr>
                  <td colSpan={4} style={{padding: '24px', textAlign: 'center', color: '#9ca3af'}}>No templates found.</td>
                </tr>
              )}
              {templates.map(tpl => (
                <tr key={tpl.id} style={{borderBottom: '1px solid #e5e7eb'}}>
                  <td style={{padding: '12px 16px', fontWeight: 500}}>{tpl.name}</td>
                  <td style={{padding: '12px 16px'}}>
                    <div style={{fontSize:12, color:"#6b7280"}}>
                      {tpl.company_name} › {tpl.product_name} › {tpl.document_type_name}
                    </div>
                  </td>
                  <td style={{padding: '12px 16px'}}>
                    <span style={{
                      background: tpl.is_active ? '#d1fae5':'#f3f4f6',
                      color: tpl.is_active ? '#065f46':'#4b5563',
                      padding:"4px 8px", borderRadius:4, fontSize:12, fontWeight:600
                    }}>
                      {tpl.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  {admin && (
                    <td style={{padding: '12px 16px', textAlign:"right", display:"flex", justifyContent:"flex-end", gap:8}}>
                      <label style={{...EDIT_BTN, display:'inline-flex', alignItems:'center', gap:4, margin:0, cursor:'pointer', background:'#f3f4f6'}}>
                        <FiRefreshCw size={12}/> Replace DOCX
                        <input type="file" style={{display:'none'}} accept=".docx" onChange={(e) => handleUploadDocx(e, tpl.id)} />
                      </label>
                      {tpl.engine_type === 'docx' ? (
                        <button onClick={() => handleOpenSchemaEditor(tpl.id)} style={{...EDIT_BTN, display:'flex', alignItems:'center', gap:4, margin: 0, background:'#eff6ff', color:'#1d4ed8'}}>
                          <FiEye size={12}/> Configure Form
                        </button>
                      ) : (
                        <button onClick={() => console.log('Edit layout', tpl.id)} style={{...EDIT_BTN, display:'flex', alignItems:'center', gap:4, margin: 0}}>
                          <FiEdit2 size={12}/> Edit Layout
                        </button>
                      )}
                      <button onClick={() => handleDeleteTemplate(tpl.id)} style={{...EDIT_BTN, display:'flex', alignItems:'center', gap:4, margin: 0, background:'#fee2e2', color:'#b91c1c'}}>
                        <FiTrash2 size={12}/> Delete
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      {schemaEditorId && (
        <SchemaEditorModal 
          templateId={schemaEditorId}
          onClose={() => setSchemaEditorId(null)}
          onToast={onToast}
        />
      )}
    </>
  );
}
