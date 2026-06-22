/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Layout } from './components/Layout';
import { PublicLayout } from './components/PublicLayout';
import { Home } from './pages/public/Home';
import { Login } from './pages/public/Login';
import { Campaign } from './pages/public/Campaign';
import { CampaignDisplay } from './pages/public/CampaignDisplay';

import { Settings } from './pages/admin/Settings';
import { Profile } from './pages/admin/Profile';
import { Finance as AdminFinance } from './pages/admin/Finance';
import { HomeVisits } from './pages/HomeVisits';
import { SponsorDashboard } from './pages/portal/SponsorDashboard';
import { SponsorshipGallery } from './pages/portal/SponsorshipGallery';
import { SupporterStore } from './pages/portal/SupporterStore';
import { PortalMessages } from './pages/portal/PortalMessages';
import { PortalGifts } from './pages/portal/PortalGifts';
import { SupporterLanding } from './pages/public/SupporterLanding';
import { LocalProjects } from './pages/public/LocalProjects';
import { Blog } from './pages/public/Blog';
import { Ecommerce } from './pages/public/Ecommerce';
import { Projects } from './pages/erp/Projects';
import { Finance } from './pages/erp/Finance';
import { WorkspaceChat } from './pages/erp/WorkspaceChat';
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
import { VisitProvider } from './contexts/VisitContext';
import { PatientProvider } from './contexts/PatientContext';
import { ProjectProvider } from './contexts/ProjectContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AnnouncementProvider } from './contexts/AnnouncementContext';
import { ImpactProvider } from './contexts/ImpactContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { FundraisingProvider } from './contexts/FundraisingContext';
import { StoreProvider } from './contexts/StoreContext';
import { CommDashboard } from './pages/communication/CommDashboard';
import { CommProjects } from './pages/communication/CommProjects';

import { SetPassword } from './pages/public/SetPassword';
import { SponsorSetup } from './pages/public/SponsorSetup';
import { CommChat } from './pages/communication/CommChat';
import { CommBlogAdmin } from './pages/communication/CommBlogAdmin';
import { CommEmailTemplates } from './pages/communication/CommEmailTemplates';
import { NutritionSupporterUpdates } from './pages/nutrition/SupporterUpdates';
import { ImpactFeedManager } from './pages/admin/ImpactFeedManager';
import { SupporterMessages } from './pages/admin/SupporterMessages';
import { NutritionMessages } from './pages/nutrition/NutritionMessages';
import { GiftManager } from './pages/admin/GiftManager';
import { FundraisingManager } from './pages/admin/FundraisingManager';
import { AdminStoreManager } from './pages/admin/AdminStoreManager';
import { WorkspaceProvider } from './contexts/WorkspaceContext';
import { WorkspaceLayout } from './components/workspace/WorkspaceLayout';
import { WorkspaceViewContainer } from './pages/erp/WorkspaceViewContainer';
import { TeamProvider } from './contexts/TeamContext';
import { TeamsContainer } from './pages/erp/teams/TeamsContainer';
import { MyTasksView } from './pages/erp/MyTasksView';
import { GlobalSearchView } from './pages/erp/GlobalSearchView';
import { WorkspaceHome } from './pages/erp/WorkspaceHome';
import { WorkspaceInbox } from './pages/erp/WorkspaceInbox';
import { WorkspaceProjects } from './pages/erp/WorkspaceProjects';
import { WorkspaceCalendarPage } from './pages/erp/WorkspaceCalendarPage';
import { CalendarProvider } from './contexts/CalendarContext';

function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode, allowedRoles: string[] }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#F49853]"></div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" />;
  
  // Admin has access to everything
  if (user.role === 'ADMIN') return <>{children}</>;

  // Check if role is allowed
  if (!allowedRoles.includes(user.role)) {
    const fallback = user.role === 'SPONSOR' ? '/portal' : '/workspace';
    
    // Prevent infinite loop if already at fallback
    if (location.pathname.startsWith(fallback)) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <div className="p-8 text-center bg-white rounded-2xl shadow-sm border border-slate-100 max-w-md">
            <h2 className="text-xl font-bold text-slate-800 mb-2">Acesso Restrito</h2>
            <p className="text-slate-500 mb-6">Seu perfil ({user.role}) não possui permissão para acessar esta área.</p>
            <button onClick={() => window.location.href = '/login'} className="text-blue-600 hover:underline">Voltar para o Login</button>
          </div>
        </div>
      );
    }
    
    return <Navigate to={fallback} />;
  }
  
  return <>{children}</>;
}

function RootRedirect() {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#F49853]"></div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" />;
  if (user.role === 'SPONSOR') return <Navigate to="/portal" />;
  if (user.role === 'ADMIN') return <Navigate to="/admin" />;
  return <Navigate to="/workspace" />;
}

export default function App() {
  return (
  <AuthProvider>
    <NotificationProvider>
    <FundraisingProvider>
    <AnnouncementProvider>
      <ImpactProvider>
        <PatientProvider>
          <ProjectProvider>
            <AtendimentoProvider>
              <VisitProvider>
            <InventoryProvider>
              <StoreProvider>
                <WorkspaceProvider>
                  <TeamProvider>
                    <CalendarProvider>
              <Router>
              <Routes>
                {/* Dedicated full-screen Display Route */}
                <Route path="/campanha-display" element={<CampaignDisplay />} />

                <Route element={<PublicLayout />}>
                  <Route path="/" element={<Home />} />
                  <Route path="/blog" element={<Blog />} />
                  <Route path="/loja" element={<Ecommerce />} />
                  <Route path="/projetos" element={<LocalProjects />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/set-password" element={<SetPassword />} />
                  <Route path="/cadastro-apadrinhador" element={<SponsorSetup />} />
                  <Route path="/apoiador" element={<SupporterLanding />} />
                  <Route path="/campanha" element={<Campaign />} />
                </Route>

                <Route path="/admin/*" element={
                  <ProtectedRoute allowedRoles={['ADMIN', 'USER']}>
                    <Layout module="admin">
                      <Routes>
                        <Route path="/" element={<Navigate to="/admin/projects" replace />} />
                        <Route path="/impact-feed" element={<ImpactFeedManager />} />
                        <Route path="/messages" element={<SupporterMessages />} />
                        <Route path="/gifts" element={<GiftManager />} />
                        <Route path="/fundraising" element={<FundraisingManager />} />
                        <Route path="/projects" element={<Settings />} />
                        <Route path="/local-projects" element={<Settings />} />
                        <Route path="/users" element={<Settings />} />
                        <Route path="/finance" element={<AdminFinance />} />
                        <Route path="/store" element={<AdminStoreManager />} />
                        <Route path="/settings" element={<Settings />} />
                        <Route path="/profile" element={<Profile />} />
                        <Route path="*" element={<Navigate to="/admin/settings" replace />} />
                      </Routes>
                    </Layout>
                  </ProtectedRoute>
                } />

                {/* Workspace (Personal Workspace) - Novo ClickUp Style */}
                <Route path="/workspace" element={
                  <ProtectedRoute allowedRoles={['ADMIN', 'USER', 'VOLUNTEER', 'VOLUNTARIO', 'STAFF', 'SOCIAL_WORKER', 'NURSE', 'DOCTOR', 'ACS', 'COORDINATOR']}>
                    <Layout module="workspace">
                      <WorkspaceLayout />
                    </Layout>
                  </ProtectedRoute>
                }>
                  <Route index element={<WorkspaceViewContainer />} />
                  <Route path="inicio" element={<WorkspaceHome />} />
                  <Route path="inbox" element={<WorkspaceInbox />} />
                  <Route path="projects" element={<WorkspaceProjects />} />
                  <Route path="calendar" element={<WorkspaceCalendarPage />} />
                  <Route path="equipes/*" element={<TeamsContainer />} />
                  <Route path="my-tasks" element={<MyTasksView />} />
                  <Route path="search" element={<GlobalSearchView />} />
                  <Route path="*" element={<WorkspaceViewContainer />} />
                </Route>

                {/* Communication Module */}
                <Route path="/communication/*" element={
                  <ProtectedRoute allowedRoles={['ADMIN', 'USER', 'VOLUNTEER', 'VOLUNTARIO', 'STAFF', 'SOCIAL_WORKER', 'NURSE', 'DOCTOR', 'ACS', 'COORDINATOR']}>
                    <Layout module="communication">
                      <Routes>
                        <Route path="/" element={<CommDashboard />} />
                        <Route path="/projects" element={<CommProjects />} />
                        <Route path="/chat" element={<CommChat />} />
                        <Route path="/blog" element={<CommBlogAdmin />} />
                        <Route path="/email-templates" element={<CommEmailTemplates />} />
                        <Route path="*" element={<div className="p-8 text-center text-slate-500">Módulo em desenvolvimento...</div>} />
                      </Routes>
                    </Layout>
                  </ProtectedRoute>
                } />

                {/* Nutrition Module */}
                <Route path="/nutrition/*" element={
                  <ProtectedRoute allowedRoles={['ADMIN', 'USER', 'VOLUNTEER', 'VOLUNTARIO', 'STAFF', 'SOCIAL_WORKER', 'NURSE', 'DOCTOR', 'ACS', 'COORDINATOR']}>
                    <Layout module="nutrition">
                      <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/patients" element={<Patients />} />
                        <Route path="/patients/new" element={<NewPatient />} />
                        <Route path="/patients/:id" element={<PatientDetails />} />
                        <Route path="/waiting-list" element={<WaitingList />} />
                        <Route path="/updates" element={<NutritionSupporterUpdates />} />
                        <Route path="/inventory" element={<Inventory />} />
                        <Route path="/management" element={<Management />} />
                        <Route path="/atendimento" element={<Atendimentos />} />
                        <Route path="/visits" element={<HomeVisits />} />
                        <Route path="*" element={<div className="p-8 text-center text-slate-500">Módulo em desenvolvimento...</div>} />
                      </Routes>
                    </Layout>
                  </ProtectedRoute>
                } />

                {/* Supporter Module / Portal */}
                <Route path="/portal/*" element={
                  <ProtectedRoute allowedRoles={['ADMIN', 'USER', 'SPONSOR']}>
                    <Layout module="supporter">
                      <Routes>
                        <Route path="/dashboard" element={<SponsorDashboard />} />
                        <Route path="/sponsorship" element={<SponsorshipGallery />} />
                        <Route path="/shop" element={<SupporterStore />} />
                        <Route path="/messages" element={<PortalMessages />} />
                        <Route path="/gifts" element={<PortalGifts />} />
                        <Route path="/impact" element={<SponsorDashboard />} />
                        <Route path="*" element={<Navigate to="/portal/dashboard" replace />} />
                      </Routes>
                    </Layout>
                  </ProtectedRoute>
                } />
                
                <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Router>
                    </CalendarProvider>
                  </TeamProvider>
                </WorkspaceProvider>
              </StoreProvider>
            </InventoryProvider>
              </VisitProvider>
            </AtendimentoProvider>
          </ProjectProvider>
        </PatientProvider>
      </ImpactProvider>
    </AnnouncementProvider>
    </FundraisingProvider>
    </NotificationProvider>
  </AuthProvider>
  );
}
