/**
 * Auth Page Loader Component
 * Reusable loading spinner for auth pages
 * 
 * Usage:
 * <Suspense fallback={<AuthPageLoader />}>
 *   <YourAuthPage />
 * </Suspense>
 */

'use client';

export const AuthPageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="text-center">
      <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      <p className="mt-4 text-gray-600">Loading...</p>
    </div>
  </div>
);

export default AuthPageLoader;
