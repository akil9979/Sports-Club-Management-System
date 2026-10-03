import React from 'react';
import { Routes, Route } from 'react-router-dom';
import PublicLayout from '../layouts/PublicLayout.jsx';
import HomePage from '../pages/public/HomePage.jsx';
import MembershipPage from '../pages/public/MembershipPage.jsx';
import CourtsPage from '../pages/public/CourtsPage.jsx';
import ShopPage from '../pages/public/ShopPage.jsx';
import EnquiryPage from '../pages/public/EnquiryPage.jsx';
import NotFoundPage from '../pages/public/NotFoundPage.jsx';

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/membership" element={<MembershipPage />} />
        <Route path="/courts" element={<CourtsPage />} />
        <Route path="/shop" element={<ShopPage />} />
        <Route path="/enquiry" element={<EnquiryPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
