/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { PublicLayout } from './components/PublicLayout';
import { Home } from './pages/public/Home';
import { Login } from './pages/public/Login';
import { ModuleSelector } from './pages/admin/ModuleSelector';
import { Settings } from './pages/admin/Settings';
import { Profile } from './pages/admin/Profile';
import { Finance as AdminFinance } from './pages/admin/Finance';
import { HomeVisits } from './pages/HomeVisits';
import { SponsorDashboard } from './pages/portal/SponsorDashboard';
import { ErpDashboard } from './pages/erp/ErpDashboard';
import { Blog } from './pages/public/Blog';
import { Ecommerce } from './pages/public/Ecommerce';
import { Projects } from './pages/erp/Projects';
import { Finance } from './pages/erp/Finance';
import { Team } from './pages/erp/Team';
import { Calendar } from './pages/erp/Calendar';
import { Dashboard } from './pages/Dashboard';
import { Patients } from './pages/Patients';
import { PatientDetails } from './pages/PatientDetails';
import { NewPatient } from './pages/NewPatient';
import { WaitingList } from './pages/WaitingList';
import { Management } from './pages/Management';
import { Inventory } from './pages/Inventory';
import { Atendimentos } from './pages/Atendimentos';
import { InventoryProvider } from './contexts/InventoryContext';
import { AtendimentoProvider } from './contexts/AtendimentoContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';

function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode, allowedRoles: string[] }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  
  // Admin has access to everything
  if (user.role === 'ADMIN') return <>{children}</>;

  // Check if role is allowed
  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/admin" />;
  }
  
  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <AtendimentoProvider>
        <InventoryProvider>
          <Router>
            <Routes>
              {/* Public Routes */}
              <Route element={<PublicLayout />}>
                <Route path="/" element={<Home />} />
                <Route path="/blog" element={<Blog />} />
                <Route path="/loja" element={<Ecommerce />} />
                <Route path="/login" element={<Login />} />
              </Route>

              {/* Internal / Admin Module Selector */}
              <Route path="/admin" element={
                <ProtectedRoute allowedRoles={['ADMIN', 'USER']}>
                  <ModuleSelector />
                </ProtectedRoute>
              } />

              <Route path="/admin/*" element={
                <ProtectedRoute allowedRoles={['ADMIN', 'USER']}>
                  <Layout module="admin">
                    <Routes>
                      <Route path="/" element={<Navigate to="/admin/projects" replace />} />
                      <Route path="/projects" element={<Settings />} />
                      <Route path="/users" element={<Settings />} />
                      <Route path="/finance" element={<AdminFinance />} />
                      <Route path="/settings" element={<Settings />} />
                      <Route path="/profile" element={<Profile />} />
                      <Route path="*" element={<Navigate to="/admin/settings" replace />} />
                    </Routes>
                  </Layout>
                </ProtectedRoute>
              } />

              {/* ERP Module */}
              <Route path="/erp/*" element={
                <ProtectedRoute allowedRoles={['ADMIN', 'USER']}>
                  <Layout module="erp">
                    <Routes>
                      <Route path="/" element={<ErpDashboard />} />
                      <Route path="/projects" element={<Navigate to="/admin/settings" replace />} />
                      <Route path="/finance" element={<Finance />} />
                      <Route path="/team" element={<Team />} />
                      <Route path="/calendar" element={<Calendar />} />
                      <Route path="*" element={<div className="p-8 text-center text-slate-500">Módulo em desenvolvimento...</div>} />
                    </Routes>
                  </Layout>
                </ProtectedRoute>
              } />

              {/* Nutrition Module */}
              <Route path="/nutrition/*" element={
                <ProtectedRoute allowedRoles={['ADMIN', 'USER']}>
                  <Layout module="nutrition">
                    <Routes>
                      <Route path="/" element={<Dashboard />} />
                      <Route path="/patients" element={<Patients />} />
                      <Route path="/patients/new" element={<NewPatient />} />
                      <Route path="/patients/:id" element={<PatientDetails />} />
                       <Route path="/waiting-list" element={<WaitingList />} />
                      <Route path="/inventory" element={<Inventory />} />
                      <Route path="/management" element={<Management />} />
                      <Route path="/atendimento" element={<Atendimentos />} />
                      <Route path="/visits" element={<HomeVisits />} />
                      <Route path="*" element={<div className="p-8 text-center text-slate-500">Módulo em desenvolvimento...</div>} />
                    </Routes>
                  </Layout>
                </ProtectedRoute>
              } />
              
              {/* Legacy fallback */}
              <Route path="/portal/*" element={<Navigate to="/admin" />} />
            </Routes>
          </Router>
        </InventoryProvider>
      </AtendimentoProvider>
    </AuthProvider>
  );
}
