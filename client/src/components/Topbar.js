import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Topbar = () => {
  const [unread, setUnread] = useState(0);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const fetchAlerts = () => axios.get('/api/alerts?acknowledged=false&limit=1').then(r => setUnread(r.data.unread || 0)).catch(() => {});
    fetchAlerts();
    const ai = setInterval(fetchAlerts, 15000);
    const ti = setInterval(() => setTime(new Date()), 1000);
    return () => { clearInterval(ai); clearInterval(ti); };
  }, []);

  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 24px', height:62, background:'var(--bg-card)', borderBottom:'1px solid var(--border)', position:'sticky', top:0, zIndex:50 }}>
      <div style={{ display:'flex', alignItems:'center', gap:8, fontSize:13, color:'var(--text-secondary)', background:'rgba(46,213,115,0.08)', padding:'6px 14px', borderRadius:20, border:'1px solid rgba(46,213,115,0.2)' }}>
        <div style={{ width:8, height:8, borderRadius:'50%', background:'var(--success)', animation:'pulse 2s infinite' }}></div>
        System Active
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:18 }}>
        <div style={{ fontSize:13, color:'var(--text-muted)' }}>
          <i className="fa-regular fa-clock" style={{ color:'var(--primary)', marginRight:6 }}></i>
          {time.toLocaleTimeString()} &nbsp;|&nbsp; {time.toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'})}
        </div>
        {unread > 0 && (
          <a href="/alerts" style={{ display:'flex', alignItems:'center', gap:6, padding:'5px 14px', background:'rgba(255,71,87,0.15)', border:'1px solid rgba(255,71,87,0.3)', borderRadius:20, color:'var(--danger)', fontSize:13, fontWeight:600, textDecoration:'none' }}>
            <i className="fa-solid fa-bell"></i> {unread} Alert{unread > 1 ? 's' : ''}
          </a>
        )}
      </div>
    </div>
  );
};

export default Topbar;
