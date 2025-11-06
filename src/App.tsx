import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import CreateBidPage from './pages/CreateBidPage';
import BidDetailPage from './pages/BidDetailPage';
import OrganizationManagementPage from './pages/OrganizationManagementPage';
import SubcontractorManagementPage from './pages/SubcontractorManagementPage';
import SubcontractorDirectoryPage from './pages/SubcontractorDirectoryPage';
import OpportunitiesPage from './pages/OpportunitiesPage';
import PreBidAssessmentPage from './pages/PreBidAssessmentPage';
import ComplianceRulesPage from './pages/ComplianceRulesPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/create-bid" element={<CreateBidPage />} />
        <Route path="/bid/:id" element={<BidDetailPage />} />
        <Route path="/organizations" element={<OrganizationManagementPage />} />
        <Route path="/subcontractors" element={<SubcontractorManagementPage />} />
        <Route path="/directory" element={<SubcontractorDirectoryPage />} />
        <Route path="/opportunities" element={<OpportunitiesPage />} />
        <Route path="/assessment/:opportunityId" element={<PreBidAssessmentPage />} />
        <Route path="/compliance-rules" element={<ComplianceRulesPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;