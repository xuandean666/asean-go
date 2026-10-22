import React from 'react';
import { Route, Routes } from 'react-router-dom';

import Layout from './components/Layout';
import NotFound from './pages/NotFound/NotFound';
import DashboardPage from './pages/Dashboard/DashboardPage';
import CustomerServicePage from './pages/CustomerService/CustomerServicePage';
import LocalizationPage from './pages/Localization/LocalizationPage';
import DocumentsPage from './pages/Documents/DocumentsPage';
import MarketPage from './pages/Market/MarketPage';
import CompliancePage from './pages/Compliance/CompliancePage';
import AgentsPage from './pages/Agents/AgentsPage';
import KnowledgePage from './pages/Knowledge/KnowledgePage';
import ProjectsPage from './pages/Projects/ProjectsPage';
import TeamPage from './pages/Team/TeamPage';
import SettingsPage from './pages/Settings/SettingsPage';

const RoutesComponent = () => {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<DashboardPage />} />
        <Route path="customer-service" element={<CustomerServicePage />} />
        <Route path="localization" element={<LocalizationPage />} />
        <Route path="documents" element={<DocumentsPage />} />
        <Route path="market" element={<MarketPage />} />
        <Route path="compliance" element={<CompliancePage />} />
        <Route path="agents" element={<AgentsPage />} />
        <Route path="knowledge" element={<KnowledgePage />} />
        <Route path="projects" element={<ProjectsPage />} />
        <Route path="team" element={<TeamPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default RoutesComponent;
