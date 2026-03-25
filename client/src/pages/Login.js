import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [form, setForm] = useState({ username: 'admin', password: 'admin123' });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.username, form.password);
      toast.success('Welcome back!');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg-dark)', display:'flex', alignItems:'center', justifyContent:'center', padding:20, position:'relative', overflow:'hidden' }}>
      {/* Background blobs */}
      <div style={{ position:'absolute', width:400, height:400, borderRadius:'50%', background:'var(--primary)', filter:'blur(120px)', opacity:0.08, top:-100, left:-100 }}></div>
      <div style={{ position:'absolute', width:300, height:300, borderRadius:'50%', background:'var(--secondary)', filter:'blur(100px)', opacity:0.08, bottom:-80, right:-80 }}></div>

      <div style={{ position:'relative', zIndex:1, width:'100%', maxWidth:420 }}>
        {/* Card */}
        <div className="card" style={{ padding:40 }}>
          {/* Logo */}
          <div style={{ textAlign:'center', marginBottom:36 }}>
            <div style={{ width:72, height:72, background:'linear-gradient(135deg,#6C63FF,#00D4AA)', borderRadius:20, display:'flex', alignItems:'center', justifyContent:'center', fontSize:32, color:'white', margin:'0 auto 16px', boxShadow:'0 8px 32px rgba(108,99,255,0.4)' }}>
              <i className="fa-solid fa-brain"></i>
            </div>
            <h1 style={{ fontSize:22, fontWeight:800, marginBottom:6 }}>StressMonitor AI</h1>
            <p style={{ fontSize:13, color:'var(--text-muted)' }}>Autism Stress Detection System</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label"><i className="fa-solid fa-user" style={{ marginRight:6, color:'var(--primary)' }}></i>Username</label>
              <input className="form-input" value={form.username} onChange={e => setForm({...form, username: e.target.value})} placeholder="Enter username" required />
            </div>
            <div className="form-group">
              <label className="form-label"><i className="fa-solid fa-lock" style={{ marginRight:6, color:'var(--primary)' }}></i>Password</label>
              <input className="form-input" type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} placeholder="Enter password" required />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width:'100%', justifyContent:'center', padding:14, fontSize:15, marginTop:8, borderRadius:12 }} disabled={loading}>
              {loading ? <><div className="spinner" style={{ width:18, height:18, borderWidth:2 }}></div> Signing in...</> : <><i className="fa-solid fa-right-to-bracket"></i> Sign In</>}
            </button>
          </form>

          <div style={{ textAlign:'center', marginTop:20, fontSize:12, color:'var(--text-muted)', background:'rgba(108,99,255,0.08)', padding:'10px 16px', borderRadius:10, border:'1px solid rgba(108,99,255,0.15)' }}>
            <i className="fa-solid fa-circle-info" style={{ color:'var(--info)', marginRight:6 }}></i>
            Default: <strong style={{ color:'var(--primary)' }}>admin</strong> / <strong style={{ color:'var(--primary)' }}>admin123</strong>
          </div>
        </div>

        {/* Features */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginTop:20 }}>
          {[['fa-camera','Real-time webcam'],['fa-robot','AI stress detection'],['fa-chart-line','Live analytics'],['fa-bell','Instant alerts']].map(([icon, label]) => (
            <div key={label} style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 14px', background:'rgba(255,255,255,0.03)', border:'1px solid var(--border)', borderRadius:10, fontSize:12, color:'var(--text-muted)' }}>
              <i className={`fa-solid ${icon}`} style={{ color:'var(--primary)' }}></i> {label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Login;
