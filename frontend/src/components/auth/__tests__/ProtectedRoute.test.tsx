import { render, screen, waitFor } from '@testing-library/react';
import ProtectedRoute from '../ProtectedRoute';

const replaceMock = jest.fn();
const clearPostLogoutRedirectPathMock = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ replace: replaceMock }),
  usePathname: () => '/admin/users',
}));

jest.mock('@/hooks', () => ({
  useAuth: jest.fn(),
}));

jest.mock('../AuthPageLoader', () => ({
  AuthPageLoader: () => <div>Loading auth...</div>,
}));

const { useAuth } = jest.requireMock('@/hooks') as {
  useAuth: jest.Mock;
};

describe('ProtectedRoute', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuth.mockReturnValue({
      clearPostLogoutRedirectPath: clearPostLogoutRedirectPathMock,
      isAuthenticated: true,
      isInitialized: true,
      postLogoutRedirectPath: null,
      user: { role: 'ADMIN' },
    });
  });

  it('shows the auth loader while auth is initializing', () => {
    useAuth.mockReturnValue({
      clearPostLogoutRedirectPath: clearPostLogoutRedirectPathMock,
      isAuthenticated: false,
      isInitialized: false,
      postLogoutRedirectPath: null,
      user: null,
    });

    render(
      <ProtectedRoute>
        <div>Private area</div>
      </ProtectedRoute>,
    );

    expect(screen.getByText('Loading auth...')).toBeInTheDocument();
    expect(replaceMock).not.toHaveBeenCalled();
  });

  it('redirects unauthenticated users to login with a safe redirect param', async () => {
    useAuth.mockReturnValue({
      clearPostLogoutRedirectPath: clearPostLogoutRedirectPathMock,
      isAuthenticated: false,
      isInitialized: true,
      postLogoutRedirectPath: null,
      user: null,
    });

    render(
      <ProtectedRoute>
        <div>Private area</div>
      </ProtectedRoute>,
    );

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith('/login?redirect=%2Fadmin%2Fusers');
    });
    expect(screen.queryByText('Private area')).not.toBeInTheDocument();
  });

  it('redirects authenticated users without the required role to unauthorized', async () => {
    useAuth.mockReturnValue({
      clearPostLogoutRedirectPath: clearPostLogoutRedirectPathMock,
      isAuthenticated: true,
      isInitialized: true,
      postLogoutRedirectPath: null,
      user: { role: 'CREATOR' },
    });

    render(
      <ProtectedRoute requiredRole={['ADMIN']}>
        <div>Admin area</div>
      </ProtectedRoute>,
    );

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith('/unauthorized');
    });
    expect(screen.queryByText('Admin area')).not.toBeInTheDocument();
  });

  it('renders children when the user is authenticated and allowed', () => {
    render(
      <ProtectedRoute requiredRole={['ADMIN', 'CREATOR']}>
        <div>Allowed area</div>
      </ProtectedRoute>,
    );

    expect(screen.getByText('Allowed area')).toBeInTheDocument();
    expect(replaceMock).not.toHaveBeenCalled();
  });

  it('prefers the stored post-logout redirect path when available', async () => {
    useAuth.mockReturnValue({
      clearPostLogoutRedirectPath: clearPostLogoutRedirectPathMock,
      isAuthenticated: false,
      isInitialized: true,
      postLogoutRedirectPath: '/login?reason=logout',
      user: null,
    });

    render(
      <ProtectedRoute>
        <div>Private area</div>
      </ProtectedRoute>,
    );

    await waitFor(() => {
      expect(clearPostLogoutRedirectPathMock).toHaveBeenCalled();
      expect(replaceMock).toHaveBeenCalledWith('/login?reason=logout');
    });
  });
});
