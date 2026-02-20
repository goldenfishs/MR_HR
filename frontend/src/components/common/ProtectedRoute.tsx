import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { Result, Button } from 'antd';
import { UserRole } from '../../types';

interface ProtectedRouteProps {
  children?: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuthStore();
  const location = useLocation();

  console.log('ProtectedRoute:', { isAuthenticated, isLoading, pathname: location.pathname });

  if (!isAuthenticated) {
    return (
      <Result
        status="403"
        title="需要登录"
        subTitle="请先登录以访问此页面"
        extra={
          <Button type="primary" onClick={() => (window.location.href = '/login')}>
            前往登录
          </Button>
        }
      />
    );
  }

  // Use Outlet for nested routes, otherwise render children
  return children ? <>{children}</> : <Outlet />;
}

interface RoleRouteProps extends ProtectedRouteProps {
  allowedRoles: UserRole[];
}

export function RoleRoute({ children, allowedRoles }: RoleRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const location = useLocation();

  console.log('RoleRoute:', { user, isAuthenticated, isLoading, allowedRoles, pathname: location.pathname });

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (!user || !allowedRoles.includes(user.role)) {
    return (
      <Result
        status="403"
        title="权限不足"
        subTitle="您没有权限访问此页面"
        extra={
          <Button type="primary" onClick={() => (window.location.href = '/')}>
            返回首页
          </Button>
        }
      />
    );
  }

  // Use Outlet for nested routes, otherwise render children
  return children ? <>{children}</> : <Outlet />;
}

export function AdminRoute({ children }: ProtectedRouteProps) {
  return <RoleRoute allowedRoles={['admin']}>{children}</RoleRoute>;
}

export function InterviewerRoute({ children }: ProtectedRouteProps) {
  return <RoleRoute allowedRoles={['admin', 'interviewer']}>{children}</RoleRoute>;
}
