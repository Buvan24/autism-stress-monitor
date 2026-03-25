import React from 'react';

const colors = {
  purple: { bg:'rgba(108,99,255,0.12)', color:'var(--primary)', bar:'linear-gradient(90deg,#6C63FF,#9F7AEA)' },
  green:  { bg:'rgba(46,213,115,0.12)',  color:'var(--success)', bar:'linear-gradient(90deg,#2ED573,#38A169)' },
  red:    { bg:'rgba(255,71,87,0.12)',   color:'var(--danger)',  bar:'linear-gradient(90deg,#FF4757,#FC8181)' },
  orange: { bg:'rgba(255,165,2,0.12)',   color:'var(--warning)', bar:'linear-gradient(90deg,#FFA502,#ED8936)' },
  teal:   { bg:'rgba(0,212,170,0.12)',   color:'var(--secondary)',bar:'linear-gradient(90deg,#00D4AA,#4FD1C5)' },
  blue:   { bg:'rgba(30,144,255,0.12)',  color:'var(--info)',    bar:'linear-gradient(90deg,#1E90FF,#63B3ED)' },
};

const StatCard = ({ title, value, icon, color = 'purple', subtitle }) => {
  const c = colors[color] || colors.purple;
  return (
    <div className="card" style={{ position:'relative', overflow:'hidden' }}>
      <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:c.bar }}></div>
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:16 }}>
        <div style={{ width:46, height:46, background:c.bg, borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, color:c.color }}>
          <i className={`fa-solid ${icon}`}></i>
        </div>
      </div>
      <div style={{ fontSize:30, fontWeight:800, color:'white', lineHeight:1, marginBottom:6 }}>{value}</div>
      <div style={{ fontSize:13, color:'var(--text-muted)', fontWeight:500 }}>{title}</div>
      {subtitle && <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:4, opacity:0.7 }}>{subtitle}</div>}
    </div>
  );
};

export default StatCard;
