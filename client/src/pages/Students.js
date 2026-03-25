import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const empty = { student_id:'', name:'', age:'', classroom:'', guardian_name:'', guardian_phone:'', guardian_email:'', is_autistic:false, notes:'' };

const Students = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState(empty);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);

  const fetch = async () => { try { const r = await axios.get('/api/students'); setStudents(r.data.data); } catch { toast.error('Failed to load'); } finally { setLoading(false); } };
  useEffect(() => { fetch(); }, []);

  const submit = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      if (editMode) { await axios.put(`/api/students/${form.student_id}`, form); toast.success('Updated!'); }
      else { await axios.post('/api/students', form); toast.success('Student added!'); }
      setShowModal(false); setForm(empty); fetch();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const del = async (id) => {
    if (!window.confirm('Delete this student?')) return;
    try { await axios.delete(`/api/students/${id}`); toast.success('Deleted'); fetch(); } catch { toast.error('Delete failed'); }
  };

  const filtered = students.filter(s => s.name.toLowerCase().includes(search.toLowerCase()) || s.student_id.toLowerCase().includes(search.toLowerCase()) || s.classroom.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <div className="page-header">
        <div><h1 className="page-title">Students</h1><p className="page-sub">{students.length} registered students</p></div>
        <button className="btn btn-primary" onClick={() => { setForm(empty); setEditMode(false); setShowModal(true); }}><i className="fa-solid fa-plus"></i> Add Student</button>
      </div>

      <div className="card">
        <div style={{ display:'flex', gap:12, marginBottom:18, flexWrap:'wrap' }}>
          <div style={{ flex:1, display:'flex', alignItems:'center', gap:10, background:'var(--bg-dark)', border:'1px solid var(--border)', borderRadius:10, padding:'9px 14px', minWidth:200 }}>
            <i className="fa-solid fa-search" style={{ color:'var(--text-muted)' }}></i>
            <input style={{ flex:1, background:'none', border:'none', color:'white', fontSize:14, fontFamily:'inherit', outline:'none' }} placeholder="Search name, ID, classroom..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <span style={{ fontSize:13, color:'var(--text-muted)', alignSelf:'center' }}>{filtered.length} results</span>
        </div>

        {loading ? <div className="loading"><div className="spinner"></div></div> : (
          <div className="table-wrap">
            <table className="data-table">
              <thead><tr><th>ID</th><th>Name</th><th>Age</th><th>Class</th><th>Guardian</th><th>Type</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {filtered.map(s => (
                  <tr key={s.student_id}>
                    <td><code style={{ color:'var(--secondary)', background:'rgba(0,212,170,0.1)', padding:'2px 8px', borderRadius:4, fontSize:12 }}>{s.student_id}</code></td>
                    <td>
                      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <div style={{ width:30, height:30, background:'linear-gradient(135deg,var(--primary),var(--secondary))', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:12, color:'white', flexShrink:0 }}>{s.name.charAt(0)}</div>
                        <span style={{ fontWeight:600, color:'white' }}>{s.name}</span>
                      </div>
                    </td>
                    <td>{s.age} yrs</td>
                    <td><span style={{ padding:'3px 10px', background:'rgba(108,99,255,0.1)', border:'1px solid rgba(108,99,255,0.2)', borderRadius:6, fontSize:12, color:'var(--primary)' }}>{s.classroom}</span></td>
                    <td><div style={{ fontSize:13 }}>{s.guardian_name||'—'}</div><div style={{ fontSize:11, color:'var(--text-muted)' }}>{s.guardian_phone}</div></td>
                    <td>{<span className="badge badge-low" style={{fontSize:11}}>Enrolled</span>}</td>
                    <td><span className={`badge badge-${s.monitoring_active?'low':'moderate'}`}>{s.monitoring_active?'Active':'Paused'}</span></td>
                    <td>
                      <div style={{ display:'flex', gap:6 }}>
                        <button className="btn btn-outline btn-sm" onClick={() => { setForm({...s, age:String(s.age)}); setEditMode(true); setShowModal(true); }}><i className="fa-solid fa-pen"></i></button>
                        <button className="btn btn-danger btn-sm" onClick={() => del(s.student_id)}><i className="fa-solid fa-trash"></i></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && <tr><td colSpan="8"><div className="empty-state"><i className="fa-solid fa-users"></i><p>No students found</p></div></td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editMode ? 'Edit Student' : 'Add New Student'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}><i className="fa-solid fa-xmark"></i></button>
            </div>
            <form onSubmit={submit}>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group"><label className="form-label">Student ID *</label><input className="form-input" value={form.student_id} onChange={e=>setForm({...form,student_id:e.target.value})} placeholder="e.g. S101" required disabled={editMode} /></div>
                  <div className="form-group"><label className="form-label">Full Name *</label><input className="form-input" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Student name" required /></div>
                  <div className="form-group"><label className="form-label">Age *</label><input className="form-input" type="number" min="3" max="25" value={form.age} onChange={e=>setForm({...form,age:e.target.value})} placeholder="Age" required /></div>
                  <div className="form-group"><label className="form-label">Classroom *</label><input className="form-input" value={form.classroom} onChange={e=>setForm({...form,classroom:e.target.value})} placeholder="e.g. Class A" required /></div>
                  <div className="form-group"><label className="form-label">Guardian Name</label><input className="form-input" value={form.guardian_name} onChange={e=>setForm({...form,guardian_name:e.target.value})} placeholder="Guardian name" /></div>
                  <div className="form-group"><label className="form-label">Guardian Phone</label><input className="form-input" value={form.guardian_phone} onChange={e=>setForm({...form,guardian_phone:e.target.value})} placeholder="Phone" /></div>
                  <div className="form-group" style={{ gridColumn:'span 2' }}><label className="form-label">Guardian Email</label><input className="form-input" type="email" value={form.guardian_email} onChange={e=>setForm({...form,guardian_email:e.target.value})} placeholder="Email" /></div>
                  
                  <div className="form-group" style={{ gridColumn:'span 2' }}><label className="form-label">Notes</label><textarea className="form-input" value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} placeholder="Special notes..." rows={2} /></div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : editMode ? 'Update' : 'Add Student'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Students;
