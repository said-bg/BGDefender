'use client';

import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { UserRole } from '@/types/api';
import AdminDashboardContent from '@/features/admin/dashboard/AdminDashboardContent';

export default function AdminDashboardPage() {
  return (
    <ProtectedRoute requiredRole={[UserRole.ADMIN]}>
      <AdminDashboardContent />
    </ProtectedRoute>
  );
}
