import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const Alerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const fetchAlerts = useCallback(async () => {
    try {
      setLoading(true);
      const q = filter === 'unread' ? '?acknowledged=false'
              : filter === 'read'   ? '?acknowledged=true' : '?limit=100';
      const r = await axios.get(`/api/alerts${q}`);
      setAlerts(r.data.data || []);
    } catch {
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { fetchAlerts(); }, [fetchAlerts]);

  const ack = async (id) => {
    try { await axios.put(`/api/alerts/${id}`); toast.success('Acknowledged'); fetchAlerts(); }
    catch { toast.error('Failed'); }
  };

  const ackAll = async () => {
    try { await axios.put('/api/alerts/acknowledge-all'); toast.success('All acknowledged'); fetchAlerts(); }
    catch { toast.error('Failed'); }
  };

  const del = async (id) => {
    if (!window.confirm('Delete?')) return;
    try { await axios.delete(`/api/alerts/${id}`); toast.success('Deleted'); fetchAlerts(); }
    catch { toast.error('Failed'); }
  };

  const unread = alerts.filter(a => !a.acknowledged).length;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <i className="fa-solid fa-bell" style={{ color:'var(--danger)', marginRight:10 }}></i>Stress Alerts
          </h1>
          <p className="page-sub">{unread} unread alerts</p>
        </div>
        <div style={{ display:'flex', gap:10 }}>
          {unread > 0 && <button className="btn btn-success btn-sm" onClick={ackAll}><i className="fa-solid fa-check-double"></i> Acknowledge All</button>}
          <button className="btn btn-outline btn-sm" onClick={fetchAlerts}><i className="fa-solid fa-rotate-right"></i> Refresh</button>
        </div>
      </div>

      <div style={{ display:'flex', gap:8, marginBottom:22 }}>
        {['all','unread','read'].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding:'7px 18px', borderRadius:20, fontFamily:'inherit', cursor:'pointer', fontSize:13, transition:'all 0.2s',
            border:`1px solid ${filter===f?'var(--primary)':'var(--border)'}`,
            background: filter===f ? 'var(--primary)' : 'transparent',
            color: filter===f ? 'white' : 'var(--text-muted)'
          }}>{f.charAt(0).toUpperCase()+f.slice(1)}</button>
        ))}
      </div>

      {loading ? <div className="loading"><div className="spinner"></div></div>
      : alerts.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <i className="fa-solid fa-check-circle" style={{ color:'var(--success)' }}></i>
            <p style={{ fontSize:16, fontWeight:600, color:'white' }}>All Clear!</p>
            <p>No alerts found. Run webcam detection to generate alerts.</p>
          </div>
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(360px,1fr))', gap:16 }}>
          {alerts.map(a => (
            <div key={a._id} style={{ background:!a.acknowledged?'linear-gradient(135deg,rgba(255,71,87,0.05),var(--bg-card))':'var(--bg-card)', borderRadius:16, border:`1px solid ${!a.acknowledged?'rgba(255,71,87,0.35)':'var(--border)'}`, padding:20 }}>
              <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:14 }}>
                <div style={{ width:38, height:38, background:'rgba(255,71,87,0.15)', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', color:'var(--danger)', fontSize:16 }}>
                  <i className="fa-solid fa-triangle-exclamation"></i>
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:15, fontWeight:700, color:'white' }}>{a.student_name||a.student_id}</div>
                  <div style={{ fontSize:11, color:'var(--primary)' }}>{a.student_id}</div>
                </div>
                {!a.acknowledged && <div style={{ width:9, height:9, borderRadius:'50%', background:'var(--danger)', animation:'pulse 1.5s infinite' }}></div>}
              </div>
              <div style={{ fontSize:13, color:'var(--text-secondary)', background:'rgba(0,0,0,0.2)', borderRadius:8, padding:'9px 12px', marginBottom:14, borderLeft:'3px solid var(--danger)' }}>{a.alert_message}</div>
              <div style={{ display:'flex', flexDirection:'column', gap:5, marginBottom:14 }}>
                <div style={{ fontSize:12, color:'var(--text-muted)', display:'flex', alignItems:'center', gap:6 }}><i className="fa-regular fa-clock" style={{ color:'var(--primary)' }}></i>{new Date(a.timestamp).toLocaleString()}</div>
                <div style={{ fontSize:12, color:'var(--text-muted)', display:'flex', alignItems:'center', gap:6 }}><i className="fa-solid fa-gauge-high" style={{ color:'var(--primary)' }}></i>Confidence: {(a.confidence*100).toFixed(0)}%</div>
                {a.acknowledged && <div style={{ fontSize:12, color:'var(--success)', display:'flex', alignItems:'center', gap:6 }}><i className="fa-solid fa-check-circle"></i>Acknowledged by {a.acknowledged_by}</div>}
              </div>
              <div style={{ display:'flex', gap:8 }}>
                {!a.acknowledged && <button className="btn btn-success btn-sm" onClick={() => ack(a._id)}><i className="fa-solid fa-check"></i> Acknowledge</button>}
                <button className="btn btn-danger btn-sm" onClick={() => del(a._id)}><i className="fa-solid fa-trash"></i></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Alerts;
