/**
 * Unauthorized Page
 * Displayed when user doesn't have permission to access a resource
 */

'use client';

import Link from 'next/link';

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full text-center">
        {/* Title */}
        <h1 className="text-4xl font-bold text-gray-900">403</h1>
        
        {/* Message */}
        <p className="mt-4 text-lg text-gray-600">
          Access Denied
        </p>
        
        {/* Description */}
        <p className="mt-2 text-gray-500">
          You don&apos;t have permission to access this resource. 
          If you believe this is an error, please contact support.
        </p>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/dashboard"
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Go to Dashboard
          </Link>
          
          <Link
            href="/auth/login"
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
          >
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
