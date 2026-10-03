import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import PublicLayout from '../layouts/PublicLayout.jsx';
import HomePage from '../pages/public/HomePage.jsx';
import MembershipPage from '../pages/public/MembershipPage.jsx';
import CourtsPage from '../pages/public/CourtsPage.jsx';
import ShopPage from '../pages/public/ShopPage.jsx';
import EnquiryPage from '../pages/public/EnquiryPage.jsx';
import NotFoundPage from '../pages/public/NotFoundPage.jsx';
import StaffOperationsPage from '../pages/staff/StaffOperationsPage.jsx';
import MemberDirectoryPage from '../pages/member/MemberDirectoryPage.jsx';
import MemberRegistrationPage from '../pages/member/MemberRegistrationPage.jsx';
import MemberProfilePage from '../pages/member/MemberProfilePage.jsx';

export default function AppRoutes() {
  return (
    <Routes>
      {/* Staff & Operations Portal Routes */}
      <Route path="/staff" element={<Navigate to="/staff/bar" replace />} />
      <Route path="/staff/bar" element={<StaffOperationsPage />} />
      <Route path="/staff/operations" element={<StaffOperationsPage />} />
      <Route path="/operations" element={<Navigate to="/staff/bar" replace />} />
      <Route path="/bar" element={<Navigate to="/staff/bar" replace />} />

      {/* Public Club & Member Experience Routes (M1) */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/membership" element={<MembershipPage />} />
        <Route path="/membership/register" element={<Navigate to="/members/register" replace />} />
        <Route path="/members" element={<MemberDirectoryPage />} />
        <Route path="/members/register" element={<MemberRegistrationPage />} />
        <Route path="/members/:id" element={<MemberProfilePage />} />
        <Route path="/courts" element={<CourtsPage />} />
        <Route path="/shop" element={<ShopPage />} />
        <Route path="/enquiry" element={<EnquiryPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}


