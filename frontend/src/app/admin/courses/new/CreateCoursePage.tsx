'use client';

import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { UserRole } from '@/types/api';
import CreateCourseForm from '@/features/admin/courses/create-course/CreateCourseForm';

export default function CreateCoursePage() {
  return (
    <ProtectedRoute requiredRole={[UserRole.ADMIN]}>
      <CreateCourseForm />
    </ProtectedRoute>
  );
}
