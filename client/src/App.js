import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
import Alerts from './pages/Alerts';
import StressLogs from './pages/StressLogs';
import LiveMonitor from './pages/LiveMonitor';
import Analytics from './pages/Analytics';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return React.createElement('div', { style: { display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'#0F0F1A' } }, React.createElement('div', { className:'spinner' }));
  return user ? children : React.createElement(Navigate, { to:'/login' });
};

const Layout = ({ children }) => React.createElement('div', { className:'app-layout' },
  React.createElement(Sidebar, null),
  React.createElement('div', { className:'main-content' },
    React.createElement(Topbar, null),
    React.createElement('div', { className:'page-wrap' }, children)
  )
);

const AppRoutes = () => {
  const { user } = useAuth();
  return React.createElement(Routes, null,
    React.createElement(Route, { path:'/login', element: user ? React.createElement(Navigate,{to:'/'}) : React.createElement(Login) }),
    React.createElement(Route, { path:'/', element: React.createElement(PrivateRoute,null, React.createElement(Layout,null, React.createElement(Dashboard))) }),
    React.createElement(Route, { path:'/students', element: React.createElement(PrivateRoute,null, React.createElement(Layout,null, React.createElement(Students))) }),
    React.createElement(Route, { path:'/alerts', element: React.createElement(PrivateRoute,null, React.createElement(Layout,null, React.createElement(Alerts))) }),
    React.createElement(Route, { path:'/logs', element: React.createElement(PrivateRoute,null, React.createElement(Layout,null, React.createElement(StressLogs))) }),
    React.createElement(Route, { path:'/monitor', element: React.createElement(PrivateRoute,null, React.createElement(Layout,null, React.createElement(LiveMonitor))) }),
    React.createElement(Route, { path:'/analytics', element: React.createElement(PrivateRoute,null, React.createElement(Layout,null, React.createElement(Analytics))) }),
    React.createElement(Route, { path:'*', element: React.createElement(Navigate,{to:'/'}) })
  );
};

function App() {
  return React.createElement(AuthProvider, null,
    React.createElement(Router, null,
      React.createElement(AppRoutes),
      React.createElement(ToastContainer, { position:'top-right', autoClose:4000, theme:'dark', toastStyle:{ background:'#1A1A2E', border:'1px solid #2D3748' } })
    )
  );
}
export default App;