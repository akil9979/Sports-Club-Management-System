import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '../features/auth/AuthContext.jsx';
import { ShopCartProvider } from '../features/shop/ShopCartContext.jsx';
import ProtectedRoute from '../features/auth/ProtectedRoute.jsx';
import PublicLayout from '../layouts/PublicLayout.jsx';
import HomePage from '../pages/public/HomePage.jsx';
import MembershipPage from '../pages/public/MembershipPage.jsx';
import CourtsPage from '../pages/public/CourtsPage.jsx';
import ShopPage from '../pages/public/ShopPage.jsx';
import EnquiryPage from '../pages/public/EnquiryPage.jsx';
import NotFoundPage from '../pages/public/NotFoundPage.jsx';
import LoginPage from '../pages/auth/LoginPage.jsx';
import SignupPage from '../pages/auth/SignupPage.jsx';
import StaffOperationsPage from '../pages/staff/StaffOperationsPage.jsx';
import MemberDirectoryPage from '../pages/member/MemberDirectoryPage.jsx';
import MemberRegistrationPage from '../pages/member/MemberRegistrationPage.jsx';
import MemberProfilePage from '../pages/member/MemberProfilePage.jsx';
import MemberBookingsPage from '../pages/member/MemberBookingsPage.jsx';
import MemberShopPage from '../pages/member/MemberShopPage.jsx';
import AdminDashboardPage from '../pages/admin/AdminDashboardPage.jsx';
import ManagementDashboardPage from '../pages/management/ManagementDashboardPage.jsx';

export default function AppRoutes() {
  return (
    <AuthProvider>
      <ShopCartProvider>
        <Routes>
          {/* Protected Staff & Operations Portal Routes */}
          <Route element={<ProtectedRoute allowedRoles={['staff', 'manager', 'admin']} />}>
            <Route path="/staff" element={<Navigate to="/staff/bar" replace />} />
            <Route path="/staff/bar" element={<StaffOperationsPage />} />
            <Route path="/staff/operations" element={<StaffOperationsPage />} />
            <Route path="/operations" element={<Navigate to="/staff/bar" replace />} />
            <Route path="/bar" element={<Navigate to="/staff/bar" replace />} />
          </Route>

          {/* Public Club & Member Experience Routes (with Navbar & Layout) */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/register" element={<Navigate to="/signup" replace />} />
            <Route path="/membership" element={<MembershipPage />} />
            <Route path="/membership/register" element={<Navigate to="/members/register" replace />} />
            <Route path="/members" element={<MemberDirectoryPage />} />
            <Route path="/members/register" element={<MemberRegistrationPage />} />
            <Route path="/members/shop" element={<MemberShopPage />} />
            <Route path="/members/:id" element={<MemberProfilePage />} />
            <Route path="/member" element={<Navigate to="/members" replace />} />
            <Route path="/member/register" element={<Navigate to="/members/register" replace />} />
            <Route path="/member/:id" element={<MemberProfilePage />} />
            <Route path="/courts" element={<CourtsPage />} />
            <Route path="/member/bookings" element={<MemberBookingsPage />} />
            <Route path="/bookings" element={<MemberBookingsPage />} />
            <Route path="/shop" element={<ShopPage />} />
            <Route path="/enquiry" element={<EnquiryPage />} />

            {/* Protected Management Operations & Dashboard Routes */}
            <Route element={<ProtectedRoute allowedRoles={['staff', 'manager', 'admin']} />}>
              <Route path="/management" element={<ManagementDashboardPage />} />
              <Route path="/management/dashboard" element={<ManagementDashboardPage />} />
              <Route path="/staff/management" element={<ManagementDashboardPage />} />
            </Route>

            {/* Protected Admin Executive Portal Routes */}
            <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
              <Route path="/admin" element={<AdminDashboardPage />} />
              <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
            </Route>

            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </ShopCartProvider>
    </AuthProvider>
  );
}



