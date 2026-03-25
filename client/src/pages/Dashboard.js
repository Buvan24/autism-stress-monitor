import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Bar, Pie, Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import StatCard from '../components/StatCard';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const chartOpts = { responsive:true, maintainAspectRatio:false, plugins:{ legend:{ labels:{ color:'#A0AEC0', font:{ family:'Inter' } } } }, scales:{ x:{ ticks:{ color:'#718096' }, grid:{ color:'rgba(255,255,255,0.04)' } }, y:{ ticks:{ color:'#718096' }, grid:{ color:'rgba(255,255,255,0.04)' } } } };

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [trend, setTrend] = useState([]);
  const [dist, setDist] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [latest, setLatest] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = async () => {
    try {
      const [s, t, d, a, l] = await Promise.all([
        axios.get('/api/analytics/stats'),
        axios.get('/api/analytics/trend?days=7'),
        axios.get('/api/analytics/distribution?days=7'),
        axios.get('/api/alerts?acknowledged=false&limit=5'),
        axios.get('/api/detection/latest'),
      ]);
      setStats(s.data.data); setTrend(t.data.data); setDist(d.data.data);
      setAlerts(a.data.data); setLatest(l.data.data);
    } catch { toast.error('Failed to load data'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); const i = setInterval(fetchAll, 30000); return () => clearInterval(i); }, []);

  if (loading) return <div className="loading"><div className="spinner"></div></div>;

  const lineData = {
    labels: trend.map(d => new Date(d.date).toLocaleDateString('en',{month:'short',day:'numeric'})),
    datasets: [
      { label:'Low', data:trend.map(d=>d.Low||0), borderColor:'#2ED573', backgroundColor:'rgba(46,213,115,0.1)', tension:0.4, fill:true },
      { label:'Moderate', data:trend.map(d=>d.Moderate||0), borderColor:'#FFA502', backgroundColor:'rgba(255,165,2,0.1)', tension:0.4, fill:true },
      { label:'High', data:trend.map(d=>d.High||0), borderColor:'#FF4757', backgroundColor:'rgba(255,71,87,0.1)', tension:0.4, fill:true },
    ]
  };

  const pieColors = dist.map(d => d._id==='High'?'#FF4757':d._id==='Moderate'?'#FFA502':'#2ED573');
  const pieData = { labels:dist.map(d=>d._id), datasets:[{ data:dist.map(d=>d.count), backgroundColor:pieColors, borderColor:'#1A1A2E', borderWidth:3 }] };

  return (
    <div>
      <div className="page-header">
        <div><h1 className="page-title">Dashboard</h1><p className="page-sub">Real-time stress monitoring for autism students</p></div>
        <button className="btn btn-primary btn-sm" onClick={fetchAll}><i className="fa-solid fa-rotate-right"></i> Refresh</button>
      </div>

      {alerts.length > 0 && (
        <div style={{ display:'flex', alignItems:'center', gap:12, padding:'14px 20px', background:'rgba(255,71,87,0.08)', border:'1px solid rgba(255,71,87,0.3)', borderLeft:'4px solid var(--danger)', borderRadius:12, marginBottom:24 }}>
          <i className="fa-solid fa-triangle-exclamation" style={{ color:'var(--danger)', fontSize:18 }}></i>
          <span style={{ color:'var(--danger)', fontWeight:600 }}>{alerts.length} high stress alert(s) need attention!</span>
          <a href="/alerts" className="btn btn-danger btn-sm" style={{ marginLeft:'auto' }}>View Alerts</a>
        </div>
      )}

      <div className="grid-4" style={{ marginBottom:24 }}>
        <StatCard title="Total Students" value={stats?.totalStudents||0} icon="fa-user-graduate" color="purple" subtitle={`${stats?.activeStudents||0} monitored`} />
        <StatCard title="Total Detections" value={stats?.totalDetections||0} icon="fa-camera" color="teal" subtitle={`${stats?.todayDetections||0} today`} />
        <StatCard title="High Stress Events" value={stats?.stressDistribution?.High||0} icon="fa-triangle-exclamation" color="red" />
        <StatCard title="Pending Alerts" value={stats?.unreadAlerts||0} icon="fa-bell" color="orange" />
      </div>

      <div className="grid-2" style={{ marginBottom:24 }}>
        <div className="card">
          <div className="card-title"><i className="fa-solid fa-chart-line"></i> 7-Day Stress Trend</div>
          <div style={{ height:230 }}><Line data={lineData} options={chartOpts} /></div>
        </div>
        <div className="card">
          <div className="card-title"><i className="fa-solid fa-chart-pie"></i> Stress Distribution</div>
          <div style={{ height:230, display:'flex', alignItems:'center', justifyContent:'center' }}>
            {dist.length > 0 ? <Pie data={pieData} options={{ maintainAspectRatio:false, plugins:{ legend:{ position:'right', labels:{ color:'#A0AEC0' } } } }} /> : <div className="empty-state"><i className="fa-solid fa-chart-pie"></i><p>No data yet</p></div>}
          </div>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-header-row">
            <div className="card-title" style={{ marginBottom:0 }}><i className="fa-solid fa-radar"></i> Latest Per Student</div>
          </div>
          <div className="table-wrap">
            <table className="data-table">
              <thead><tr><th>Student</th><th>Stress</th><th>Conf.</th><th>Time</th></tr></thead>
              <tbody>
                {latest.map(item => (
                  <tr key={item.student_id}>
                    <td>
                      <div style={{ fontWeight:600, color:'white' }}>{item.name}</div>
                      <div style={{ fontSize:11, color:'var(--text-muted)' }}>{item.student_id} </div>
                    </td>
                    <td>{item.latest_detection ? <span className={`badge badge-${item.latest_detection.stress_level.toLowerCase()}`}>{item.latest_detection.stress_level}</span> : <span style={{ color:'var(--text-muted)', fontSize:12 }}>No data</span>}</td>
                    <td style={{ fontSize:12 }}>{item.latest_detection ? `${(item.latest_detection.confidence*100).toFixed(0)}%` : '—'}</td>
                    <td style={{ fontSize:11, color:'var(--text-muted)' }}>{item.latest_detection ? new Date(item.latest_detection.timestamp).toLocaleTimeString() : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="card-header-row">
            <div className="card-title" style={{ marginBottom:0 }}><i className="fa-solid fa-bell"></i> Recent Alerts</div>
            <a href="/alerts" className="btn btn-outline btn-sm">View All</a>
          </div>
          {alerts.length === 0 ? (
            <div className="empty-state"><i className="fa-solid fa-check-circle" style={{ color:'var(--success)' }}></i><p>No active alerts!</p></div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {alerts.map(a => (
                <div key={a._id} style={{ display:'flex', gap:12, padding:'12px', background:'rgba(255,71,87,0.06)', border:'1px solid rgba(255,71,87,0.2)', borderRadius:10 }}>
                  <div style={{ width:32, height:32, background:'rgba(255,71,87,0.15)', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', color:'var(--danger)', flexShrink:0 }}>
                    <i className="fa-solid fa-triangle-exclamation"></i>
                  </div>
                  <div>
                    <div style={{ fontSize:13, fontWeight:600, color:'white', marginBottom:2 }}>{a.student_name||a.student_id}</div>
                    <div style={{ fontSize:11, color:'var(--text-muted)' }}>{new Date(a.timestamp).toLocaleString()}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
