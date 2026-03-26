/**
 * Example Dashboard Page
 * Shows how to use ProtectedRoute
 */

'use client';

import { ProtectedRoute } from '@/components/auth';
import { useAuth } from '@/hooks';

function DashboardContent() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Welcome back!
          </h2>

          {/* User Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Email</p>
              <p className="text-lg font-medium text-gray-900">{user?.email}</p>
            </div>

            <div>
              <p className="text-sm text-gray-600">Role</p>
              <p className="text-lg font-medium text-gray-900">{user?.role}</p>
            </div>

            <div>
              <p className="text-sm text-gray-600">Plan</p>
              <p className="text-lg font-medium text-gray-900">{user?.plan}</p>
            </div>

            <div>
              <p className="text-sm text-gray-600">Status</p>
              <p className="text-lg font-medium text-green-600">
                {user?.isActive ? 'Active' : 'Inactive'}
              </p>
            </div>
          </div>

          {/* Placeholder Content */}
          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-900">
              ✅ This page is protected! Only authenticated users can see it.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

/**
 * Dashboard Page with ProtectedRoute
 */
export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}
