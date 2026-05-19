'use client';

import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { UserRole } from '@/types/api';
import CreatorDashboardContent from './CreatorDashboardContent';

export default function CreatorDashboardPage() {
  return (
    <ProtectedRoute requiredRole={[UserRole.CREATOR]}>
      <CreatorDashboardContent />
    </ProtectedRoute>
  );
}
