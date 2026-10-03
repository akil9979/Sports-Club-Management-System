import React from 'react';
import HeroSection from '../../components/public/HeroSection.jsx';
import ClubHighlightsSection from '../../components/public/ClubHighlightsSection.jsx';
import MembershipPlansSection from '../../components/public/MembershipPlansSection.jsx';
import CourtAvailabilitySection from '../../components/public/CourtAvailabilitySection.jsx';
import ShopCatalogueSection from '../../components/public/ShopCatalogueSection.jsx';
import EnquiryFormSection from '../../components/public/EnquiryFormSection.jsx';
import TrialCTASection from '../../components/public/TrialCTASection.jsx';

export default function HomePage() {
  return (
    <div className="w-full space-y-4">
      {/* 1. Hero Section */}
      <HeroSection />

      {/* 2. Core Highlights Solving the Problem Statement */}
      <ClubHighlightsSection />

      {/* 3. Membership Plans & Pricing */}
      <MembershipPlansSection />

      {/* 4. Court Availability View */}
      <CourtAvailabilitySection />

      {/* 5. Shop Catalogue Preview */}
      <ShopCatalogueSection />

      {/* 6. Trial CTA Banner */}
      <TrialCTASection />

      {/* 7. Enquiry Form */}
      <EnquiryFormSection />
    </div>
  );
}
