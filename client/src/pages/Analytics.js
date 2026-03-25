import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Bar, Pie, Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import StatCard from '../components/StatCard';
ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const opts = { responsive:true, maintainAspectRatio:false, plugins:{ legend:{ labels:{ color:'#A0AEC0', font:{ family:'Inter', size:12 } } } }, scales:{ x:{ ticks:{ color:'#718096' }, grid:{ color:'rgba(255,255,255,0.04)' } }, y:{ ticks:{ color:'#718096' }, grid:{ color:'rgba(255,255,255,0.04)' } } } };

const Analytics = () => {
  const [stats, setStats] = useState(null);
  const [trend, setTrend] = useState([]);
  const [dist, setDist] = useState([]);
  const [summary, setSummary] = useState([]);
  const [days, setDays] = useState(7);

  useEffect(() => {
    const load = async () => {
      try {
        const [s,t,d,ss] = await Promise.all([
          axios.get('/api/analytics/stats'),
          axios.get(`/api/analytics/trend?days=${days}`),
          axios.get(`/api/analytics/distribution?days=${days}`),
          axios.get('/api/analytics/students'),
        ]);
        setStats(s.data.data); setTrend(t.data.data); setDist(d.data.data); setSummary(ss.data.data);
      } catch {}
    };
    load();
  }, [days]);

  const lineData = { labels:trend.map(d=>new Date(d.date).toLocaleDateString('en',{month:'short',day:'numeric'})), datasets:[
    { label:'Low', data:trend.map(d=>d.Low||0), borderColor:'#2ED573', backgroundColor:'rgba(46,213,115,0.12)', tension:0.4, fill:true },
    { label:'Moderate', data:trend.map(d=>d.Moderate||0), borderColor:'#FFA502', backgroundColor:'rgba(255,165,2,0.12)', tension:0.4, fill:true },
    { label:'High', data:trend.map(d=>d.High||0), borderColor:'#FF4757', backgroundColor:'rgba(255,71,87,0.12)', tension:0.4, fill:true },
  ]};

  const pieColors = dist.map(d=>d._id==='High'?'#FF4757':d._id==='Moderate'?'#FFA502':'#2ED573');
  const pieData = { labels:dist.map(d=>d._id), datasets:[{ data:dist.map(d=>d.count), backgroundColor:pieColors, borderColor:'#1A1A2E', borderWidth:3 }] };

  const barData = { labels:summary.slice(0,8).map(s=>s._id), datasets:[
    { label:'High Stress', data:summary.slice(0,8).map(s=>s.highCount), backgroundColor:'rgba(255,71,87,0.7)', borderRadius:6 },
    { label:'Total', data:summary.slice(0,8).map(s=>s.total), backgroundColor:'rgba(108,99,255,0.5)', borderRadius:6 },
  ]};

  return (
    <div>
      <div className="page-header">
        <div><h1 className="page-title">Analytics</h1><p className="page-sub">Stress monitoring insights</p></div>
        <div style={{ display:'flex', gap:8 }}>
          {[7,14,30].map(d => <button key={d} className={`btn btn-sm ${days===d?'btn-primary':'btn-outline'}`} onClick={()=>setDays(d)}>Last {d}d</button>)}
        </div>
      </div>

      {stats && <div className="grid-4" style={{ marginBottom:24 }}>
        <StatCard title="Total Students" value={stats.totalStudents} icon="fa-users" color="purple" />
        <StatCard title="Total Detections" value={stats.totalDetections} icon="fa-camera" color="teal" />
        <StatCard title="High Stress Events" value={stats.stressDistribution?.High||0} icon="fa-triangle-exclamation" color="red" />
        <StatCard title="Unread Alerts" value={stats.unreadAlerts} icon="fa-bell" color="orange" />
      </div>}

      <div className="grid-2" style={{ marginBottom:20 }}>
        <div className="card"><div className="card-title"><i className="fa-solid fa-chart-line"></i>Daily Stress Trend ({days} days)</div><div style={{ height:250 }}><Line data={lineData} options={opts} /></div></div>
        <div className="card"><div className="card-title"><i className="fa-solid fa-chart-pie"></i>Stress Distribution</div><div style={{ height:250, display:'flex', alignItems:'center', justifyContent:'center' }}>{dist.length>0?<Pie data={pieData} options={{ maintainAspectRatio:false, plugins:{ legend:{ position:'right', labels:{ color:'#A0AEC0' } } } }} />:<div className="empty-state"><i className="fa-solid fa-chart-pie"></i><p>No data yet</p></div>}</div></div>
      </div>

      <div className="card" style={{ marginBottom:20 }}>
        <div className="card-title"><i className="fa-solid fa-chart-bar"></i>Stress Events per Student</div>
        <div style={{ height:260 }}><Bar data={barData} options={opts} /></div>
      </div>

      <div className="card">
        <div className="card-title"><i className="fa-solid fa-table"></i>Student Summary</div>
        <div className="table-wrap">
          <table className="data-table">
            <thead><tr><th>Student ID</th><th>Total</th><th>High Stress</th><th>Avg Confidence</th><th>Last Detection</th><th>Risk Level</th></tr></thead>
            <tbody>
              {summary.map(s => {
                const ratio = s.total>0?s.highCount/s.total:0;
                const risk = ratio>0.5?'High':ratio>0.2?'Moderate':'Low';
                return (
                  <tr key={s._id}>
                    <td><code style={{ color:'var(--secondary)', background:'rgba(0,212,170,0.1)', padding:'2px 8px', borderRadius:4, fontSize:12 }}>{s._id}</code></td>
                    <td>{s.total}</td>
                    <td style={{ color:s.highCount>0?'var(--danger)':'var(--text-secondary)', fontWeight:s.highCount>0?600:400 }}>{s.highCount}</td>
                    <td>{(s.avgConfidence*100).toFixed(1)}%</td>
                    <td style={{ fontSize:11, color:'var(--text-muted)' }}>{new Date(s.lastDetection).toLocaleString()}</td>
                    <td><span className={`badge badge-${risk.toLowerCase()}`}>{risk}</span></td>
                  </tr>
                );
              })}
              {summary.length===0 && <tr><td colSpan="6"><div className="empty-state"><i className="fa-solid fa-chart-bar"></i><p>No data</p></div></td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
