import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import { ToastProvider } from './context/ToastContext';
import Login from './components/Login';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import ViewByLocks from './pages/ViewByLocks';
import ViewByBreakers from './pages/ViewByBreakers';
import Storage from './pages/Storage';
import Personnel from './pages/Personnel';
import ElectricalPlans from './pages/ElectricalPlans';
import Settings from './pages/Settings';
import AboutMe from './pages/AboutMe';

function AppRoutes() {
  const { isAuthenticated } = useApp();

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/locks" element={<ViewByLocks />} />
        <Route path="/breakers" element={<ViewByBreakers />} />
        <Route path="/storage" element={<Storage />} />
        <Route path="/personnel" element={<Personnel />} />
        <Route path="/plans" element={<ElectricalPlans />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/about" element={<AboutMe />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}

function App() {
  return (
    <AppProvider>
      <ToastProvider>
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <AppRoutes />
        </Router>
      </ToastProvider>
    </AppProvider>
  );
}

export default App;
