import React, { useState, useEffect, useRef } from 'react';
import mammoth from 'mammoth';
import './SchemaEditorModal.css';

const API = "http://localhost:5000";

export default function SchemaEditorModal({ templateId, onClose, onToast }) {
  const [htmlContent, setHtmlContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [currentKey, setCurrentKey] = useState('');
  const [currentValue, setCurrentValue] = useState('');
  const [currentOccurrenceIndex, setCurrentOccurrenceIndex] = useState(0);
  const [fieldType, setFieldType] = useState('text');
  const [schemaFields, setSchemaFields] = useState([]);
  
  const previewRef = useRef(null);

  useEffect(() => {
    loadData();
  }, [templateId]);

  const loadData = async () => {
    try {
      setLoading(true);
      // 1. Fetch Schema
      const schemaRes = await fetch(`${API}/settings/templates/${templateId}/form-schema`);
      const schemaData = await schemaRes.json();
      const fields = Array.isArray(schemaData) ? schemaData : (schemaData?.fields || []);
      // Assign unique ids if they don't have one
      const fieldsWithIds = fields.map(f => ({ ...f, id: f.id || Date.now() + Math.random() }));
      setSchemaFields(fieldsWithIds);

      // 2. Fetch DOCX Binary
      const docxRes = await fetch(`${API}/settings/templates/${templateId}/docx`);
      if (!docxRes.ok) {
        setError("Preview not available.");
        setLoading(false);
        return;
      }
      
      const arrayBuffer = await docxRes.arrayBuffer();
      
      // 3. Convert to HTML via Mammoth
      mammoth.convertToHtml({ arrayBuffer })
        .then((result) => {
          setHtmlContent(result.value);
          setLoading(false);
        })
        .catch((err) => {
          console.error("Mammoth conversion error:", err);
          setError("Error loading document preview. Ensure a valid .docx file was uploaded.");
          setLoading(false);
        });

    } catch (err) {
      console.error(err);
      setError(`Error: ${err.message || 'Unknown error'}`);
      setLoading(false);
    }
  };

  const handleSaveSchema = async () => {
    try {
      const res = await fetch(`${API}/settings/templates/${templateId}/schema`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        // Strip the transient `id` before saving to schema
        body: JSON.stringify({ schema: { fields: schemaFields.map(({ id, ...rest }) => rest) } })
      });
      if (res.ok) {
        onToast("Schema saved successfully!");
        onClose();
      } else {
        const d = await res.json();
        onToast(d.error || "Failed to save schema", "error");
      }
    } catch {
      onToast("Server error", "error");
    }
  };

  // Capture selected text snippet
  const handleCaptureSelection = (targetType) => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      onToast("Please select some text in the preview pane first.", "error");
      return;
    }
    const selectedText = selection.toString().trim();
    if (!selectedText) {
      onToast("Selected text is empty.", "error");
      return;
    }

    if (targetType === 'KEY') {
      setCurrentKey(selectedText);
    } else if (targetType === 'VALUE') {
      setCurrentValue(selectedText);
      
      // Calculate occurrence index
      const range = selection.getRangeAt(0);
      const preRange = document.createRange();
      if (previewRef.current) {
        preRange.selectNodeContents(previewRef.current);
        preRange.setEnd(range.startContainer, range.startOffset);
        const preText = preRange.toString();
        
        let count = 0;
        let pos = preText.indexOf(selectedText);
        while (pos !== -1) {
          count++;
          pos = preText.indexOf(selectedText, pos + selectedText.length);
        }
        setCurrentOccurrenceIndex(count);
      }
    }
  };

  // Add field mapping
  const handleAssignMapping = () => {
    if (!currentKey || !currentValue) {
      onToast("Please assign both a Key and a Value.", "error");
      return;
    }

    // Convert key to a simpler identifier for internal usage
    const fieldKeyIdentifier = currentKey.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_');

    const newField = {
      id: Date.now() + Math.random(),
      field_key: fieldKeyIdentifier,
      label: currentKey.trim(),
      target_placeholder_value: currentValue.trim(),
      type: fieldType,
      occurrence_index: currentOccurrenceIndex
    };

    setSchemaFields((prev) => [...prev, newField]);
    setCurrentKey('');
    setCurrentValue('');
    setCurrentOccurrenceIndex(0);
  };

  const handleRemoveField = (id) => {
    setSchemaFields((prev) => prev.filter(field => field.id !== id));
  };

  // Highlight mapped tokens live in preview
  const getHighlightedHtml = () => {
    if (!htmlContent) return '';
    let processedHtml = htmlContent;

    schemaFields.forEach((field) => {
      if (field.target_placeholder_value) {
        const escaped = field.target_placeholder_value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`(${escaped})`, 'g');
        let matchCount = 0;
        processedHtml = processedHtml.replace(regex, (match, p1) => {
          if (field.occurrence_index === undefined || matchCount === field.occurrence_index) {
            matchCount++;
            return `<span class="mapped-token-active" title="Mapped Key: ${field.label || field.field_key}">${p1}</span>`;
          }
          matchCount++;
          return match;
        });
      }
    });

    return processedHtml;
  };

  return (
    <div className="modal-backdrop">
      <div className="schema-editor-modal">
        <header className="modal-header">
          <h2>Configure Dynamic Form</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </header>

        <div className="schema-editor-container">
          {/* LEFT PANE: Document Preview */}
          <div className="preview-pane">
            <h3>Document Preview</h3>
            <p className="hint">Highlight text in the preview below, then click "Set as Key" or "Set as Value".</p>
            
            {loading && <div>Loading Preview...</div>}
            {error && <div style={{ color: 'red' }}>{error}</div>}
            
            {!loading && !error && (
              <div 
                className="document-html-view"
                ref={previewRef}
                dangerouslySetInnerHTML={{ __html: getHighlightedHtml() }}
              />
            )}
          </div>

          {/* RIGHT PANE: Mapping Controls */}
          <div className="config-pane">
            <h3>Field Mapping Controls</h3>
            
            <div className="selection-actions">
              <button className="btn-capture" onClick={() => handleCaptureSelection('KEY')}>
                Set Selected as Key
              </button>
              <button className="btn-capture" onClick={() => handleCaptureSelection('VALUE')}>
                Set Selected as Value
              </button>
            </div>

            <div className="field-assignment-card">
              <div className="form-group">
                <label>Form Field Name (Key):</label>
                <input 
                  type="text" 
                  value={currentKey} 
                  onChange={(e) => setCurrentKey(e.target.value)}
                  placeholder="e.g., Buyer Name"
                />
              </div>

              <div className="form-group">
                <label>Template Placeholder (Value to Replace):</label>
                <input 
                  type="text" 
                  value={currentValue} 
                  onChange={(e) => setCurrentValue(e.target.value)}
                  placeholder="e.g., Ujjwal Dwivedi"
                />
              </div>

              <div className="form-group">
                <label>Field Input Type:</label>
                <select value={fieldType} onChange={(e) => setFieldType(e.target.value)}>
                  <option value="text">Short Text</option>
                  <option value="date">Date</option>
                  <option value="number">Number</option>
                  <option value="textarea">Long Text</option>
                </select>
              </div>

              <button className="btn-assign" onClick={handleAssignMapping}>
                + Assign Mapping
              </button>
            </div>

            <div className="mapped-fields-list">
              <h4>Mapped Form Fields ({schemaFields.length})</h4>
              {schemaFields.length === 0 ? (
                <p className="no-fields">No mappings assigned yet.</p>
              ) : (
                <ul>
                  {schemaFields.map((field) => (
                    <li key={field.id} className="mapped-field-item">
                      <div className="field-details">
                        <strong>{field.label || field.field_key}</strong> <br />
                        <small>Replaces: "{field.target_placeholder_value}" ({field.type})</small>
                      </div>
                      <button className="btn-delete" onClick={() => handleRemoveField(field.id)}>&times;</button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        <footer className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={handleSaveSchema}>Save Schema</button>
        </footer>
      </div>
    </div>
  );
}
