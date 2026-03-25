import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const nav = [
  { path:'/', icon:'fa-gauge', label:'Dashboard' },
  { path:'/monitor', icon:'fa-video', label:'Live Monitor' },
  { path:'/students', icon:'fa-users', label:'Students' },
  { path:'/alerts', icon:'fa-bell', label:'Alerts' },
  { path:'/logs', icon:'fa-list', label:'Stress Logs' },
  { path:'/analytics', icon:'fa-chart-bar', label:'Analytics' },
];

const Sidebar = () => {
  const { pathname } = useLocation();
  const { user, logout } = useAuth();

  return (
    <aside style={{ width:'var(--sidebar-width)', height:'100vh', background:'var(--bg-card)', borderRight:'1px solid var(--border)', position:'fixed', top:0, left:0, zIndex:100, display:'flex', flexDirection:'column' }}>
      {/* Logo */}
      <div style={{ padding:'20px 18px', borderBottom:'1px solid var(--border)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ width:40, height:40, background:'linear-gradient(135deg,#6C63FF,#00D4AA)', borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, color:'white' }}>
            <i className="fa-solid fa-brain"></i>
          </div>
          <div>
            <div style={{ fontSize:14, fontWeight:800, color:'white' }}>StressMonitor</div>
            <div style={{ fontSize:11, color:'var(--text-muted)' }}>Stress Monitor AI</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex:1, padding:'16px 10px', overflowY:'auto' }}>
        <div style={{ fontSize:10, fontWeight:600, color:'var(--text-muted)', letterSpacing:1, padding:'0 8px 10px', textTransform:'uppercase' }}>Menu</div>
        {nav.map(item => (
          <Link key={item.path} to={item.path} style={{
            display:'flex', alignItems:'center', gap:12, padding:'11px 12px', borderRadius:10,
            color: pathname===item.path ? 'var(--primary)' : 'var(--text-secondary)',
            background: pathname===item.path ? 'rgba(108,99,255,0.12)' : 'transparent',
            border: pathname===item.path ? '1px solid rgba(108,99,255,0.25)' : '1px solid transparent',
            textDecoration:'none', fontWeight:500, fontSize:14, marginBottom:4, transition:'all 0.2s'
          }}>
            <i className={`fa-solid ${item.icon}`} style={{ width:18, textAlign:'center' }}></i>
            {item.label}
          </Link>
        ))}
      </nav>

      {/* User */}
      <div style={{ padding:'14px 10px', borderTop:'1px solid var(--border)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', background:'var(--bg-dark)', borderRadius:10, marginBottom:8 }}>
          <div style={{ width:32, height:32, background:'linear-gradient(135deg,#6C63FF,#00D4AA)', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:13, color:'white' }}>
            {user?.username?.charAt(0).toUpperCase()}
          </div>
          <div style={{ overflow:'hidden' }}>
            <div style={{ fontSize:13, fontWeight:600, color:'white', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user?.full_name || user?.username}</div>
            <div style={{ fontSize:11, color:'var(--text-muted)', textTransform:'capitalize' }}>{user?.role}</div>
          </div>
        </div>
        <button onClick={logout} style={{ width:'100%', display:'flex', alignItems:'center', gap:10, padding:'9px 12px', background:'none', border:'none', color:'var(--text-muted)', cursor:'pointer', borderRadius:10, fontSize:14, fontFamily:'inherit', transition:'all 0.2s' }}
          onMouseOver={e => e.currentTarget.style.color='var(--danger)'}
          onMouseOut={e => e.currentTarget.style.color='var(--text-muted)'}>
          <i className="fa-solid fa-right-from-bracket"></i> Logout
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
