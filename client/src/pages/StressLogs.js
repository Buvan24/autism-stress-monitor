import React, { useState, useEffect } from 'react';
import axios from 'axios';

const StressLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ stress_level:'', student_id:'' });
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);

  const fetch = async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams({ page, limit:20 });
      if (filter.stress_level) p.append('stress_level', filter.stress_level);
      if (filter.student_id) p.append('student_id', filter.student_id);
      const r = await axios.get(`/api/stresslogs?${p}`);
      setLogs(r.data.data); setTotal(r.data.total); setPages(r.data.pages);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, [page, filter]);

  const col = l => l==='High'?'var(--danger)':l==='Moderate'?'var(--warning)':'var(--success)';

  return (
    <div>
      <div className="page-header">
        <div><h1 className="page-title">Stress Detection Logs</h1><p className="page-sub">{total} total records</p></div>
      </div>
      <div className="card">
        <div style={{ display:'flex', gap:12, marginBottom:18, flexWrap:'wrap' }}>
          <select className="form-input" style={{ width:180 }} value={filter.stress_level} onChange={e=>{setFilter({...filter,stress_level:e.target.value});setPage(1);}}>
            <option value="">All Levels</option><option value="Low">Low</option><option value="Moderate">Moderate</option><option value="High">High</option>
          </select>
          <input className="form-input" style={{ width:180 }} placeholder="Filter by Student ID" value={filter.student_id} onChange={e=>{setFilter({...filter,student_id:e.target.value});setPage(1);}} />
          <button className="btn btn-outline btn-sm" onClick={()=>{setFilter({stress_level:'',student_id:''});setPage(1);}}><i className="fa-solid fa-filter-circle-xmark"></i> Clear</button>
        </div>

        {loading ? <div className="loading"><div className="spinner"></div></div> : (
          <>
            <div className="table-wrap">
              <table className="data-table">
                <thead><tr><th>Student ID</th><th>Stress Level</th><th>Confidence</th><th>Blink Rate</th><th>Eye Open</th><th>Head Tilt</th><th>Autism</th><th>Timestamp</th></tr></thead>
                <tbody>
                  {logs.map(log => (
                    <tr key={log._id}>
                      <td><code style={{ color:'var(--secondary)', background:'rgba(0,212,170,0.1)', padding:'2px 8px', borderRadius:4, fontSize:12 }}>{log.student_id}</code></td>
                      <td><span className={`badge badge-${log.stress_level.toLowerCase()}`}>{log.stress_level}</span></td>
                      <td>
                        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                          <div style={{ flex:1, height:5, background:'var(--bg-dark)', borderRadius:3, minWidth:50 }}>
                            <div style={{ width:`${(log.confidence*100).toFixed(0)}%`, height:'100%', background:col(log.stress_level), borderRadius:3 }}></div>
                          </div>
                          <span style={{ fontSize:12, fontWeight:600 }}>{(log.confidence*100).toFixed(0)}%</span>
                        </div>
                      </td>
                      <td style={{ fontSize:12 }}>{log.features?.blink_rate?.toFixed(1)||'—'}/min</td>
                      <td style={{ fontSize:12 }}>{log.features?.eye_openness?`${(log.features.eye_openness*100).toFixed(0)}%`:'—'}</td>
                      <td style={{ fontSize:12 }}>{log.features?.head_tilt?`${log.features.head_tilt.toFixed(1)}°`:'—'}</td>
                      
                      <td style={{ fontSize:11, color:'var(--text-muted)' }}>{new Date(log.timestamp).toLocaleDateString()}<br/>{new Date(log.timestamp).toLocaleTimeString()}</td>
                    </tr>
                  ))}
                  {logs.length===0 && <tr><td colSpan="8"><div className="empty-state"><i className="fa-solid fa-database"></i><p>No logs found</p></div></td></tr>}
                </tbody>
              </table>
            </div>
            {pages > 1 && (
              <div style={{ display:'flex', justifyContent:'center', gap:8, marginTop:18 }}>
                <button className="btn btn-outline btn-sm" onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1}><i className="fa-solid fa-chevron-left"></i></button>
                {[...Array(Math.min(pages,7))].map((_,i) => <button key={i+1} className={`btn btn-sm ${page===i+1?'btn-primary':'btn-outline'}`} onClick={()=>setPage(i+1)}>{i+1}</button>)}
                <button className="btn btn-outline btn-sm" onClick={()=>setPage(p=>Math.min(pages,p+1))} disabled={page===pages}><i className="fa-solid fa-chevron-right"></i></button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default StressLogs;
