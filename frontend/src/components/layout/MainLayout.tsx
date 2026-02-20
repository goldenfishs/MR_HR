import { useMemo, useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Avatar, Dropdown } from 'antd';
import type { MenuProps } from 'antd';
import {
  HomeOutlined,
  CalendarOutlined,
  BookOutlined,
  UserOutlined,
  LogoutOutlined,
  DashboardOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '../../store/authStore';

type MenuItem = Required<MenuProps>['items'][number];

const { Header, Sider, Content } = Layout;

export default function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();

  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const menuItems = useMemo<MenuItem[]>(() => {
    const commonItems: MenuItem[] = [
      {
        key: '/',
        icon: <HomeOutlined />,
        label: '首页',
      },
      {
        key: 'interviews',
        icon: <CalendarOutlined />,
        label: '面试',
        children: [
          { key: '/interviews', label: '面试列表' },
          { key: '/my-registrations', label: '我的报名' },
        ],
      },
      {
        key: 'resources',
        icon: <BookOutlined />,
        label: '资源',
        children: [
          { key: '/questions', label: '题库' },
          { key: '/resources', label: '学习资源' },
        ],
      },
    ];

    if (user?.role === 'admin') {
      return [
        ...commonItems,
        { type: 'divider' },
        {
          key: 'admin',
          icon: <DashboardOutlined />,
          label: '管理后台',
          children: [
            { key: '/admin', label: '仪表板' },
            { key: 'admin-interviews', label: '面试管理' },
            { key: 'admin-registrations', label: '报名管理' },
            { key: 'admin-questions', label: '题库管理' },
            { key: 'admin-classrooms', label: '教室管理' },
            { key: 'admin-users', label: '用户管理' },
          ],
        },
      ];
    }

    if (user?.role === 'interviewer') {
      return [
        ...commonItems,
        { type: 'divider' },
        {
          key: 'interviewer',
          icon: <DashboardOutlined />,
          label: '面试官工作区',
          children: [
            { key: '/interviewer', label: '仪表板' },
            { key: '/interviewer/slots', label: '我的场次' },
          ],
        },
      ];
    }

    return commonItems;
  }, [user?.role]);

  const handleMenuClick = ({ key }: { key: string }) => {
    const keyToPath: Record<string, string> = {
      '/': '/',
      '/interviews': '/interviews',
      '/my-registrations': '/my-registrations',
      '/questions': '/questions',
      '/resources': '/resources',
      '/profile': '/profile',
      '/admin': '/admin',
      'admin-interviews': '/admin/interviews',
      'admin-registrations': '/admin/registrations',
      'admin-questions': '/admin/questions',
      'admin-classrooms': '/admin/classrooms',
      'admin-users': '/admin/users',
      '/interviewer': '/interviewer',
      '/interviewer/slots': '/interviewer/slots',
    };

    const path = keyToPath[key];
    if (path) {
      navigate(path);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人中心',
      onClick: () => navigate('/profile'),
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout,
    },
  ];

  const selectedKey = (() => {
    const path = location.pathname;
    if (path === '/admin') return '/admin';
    if (path.startsWith('/admin/interviews')) return 'admin-interviews';
    if (path.startsWith('/admin/registrations')) return 'admin-registrations';
    if (path.startsWith('/admin/questions')) return 'admin-questions';
    if (path.startsWith('/admin/classrooms')) return 'admin-classrooms';
    if (path.startsWith('/admin/users')) return 'admin-users';
    if (path.startsWith('/interviewer')) return path;
    return path;
  })();

  const pageTitle = getPageTitle(location.pathname);
  const dateLabel = new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  }).format(new Date());

  const contentOffset = isMobile ? 0 : collapsed ? 78 : 248;

  return (
    <Layout className="main-shell">
      <Sider
        width={248}
        collapsedWidth={isMobile ? 0 : 78}
        breakpoint="lg"
        onBreakpoint={(broken) => {
          setIsMobile(broken);
          setCollapsed(broken);
        }}
        collapsible
        collapsed={collapsed}
        onCollapse={(value) => setCollapsed(value)}
        className="main-sider"
        style={{
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
        }}
      >
        <div className={`brand-pill ${collapsed ? 'collapsed' : ''}`}>
          <div className="brand-mark">IS</div>
          {!collapsed && (
            <div>
              <div className="brand-title">Interview Studio</div>
              <div className="brand-subtitle">Smart Recruiting Platform</div>
            </div>
          )}
        </div>

        <Menu
          className="app-menu"
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          items={menuItems}
          onClick={handleMenuClick}
        />
      </Sider>

      <Layout className="main-content-wrap" style={{ marginLeft: contentOffset }}>
        <Header className="header-pill" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div className="page-title">{pageTitle}</div>
            <div className="page-date">{dateLabel}</div>
          </div>

          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <div className="user-chip">
              <Avatar icon={<UserOutlined />} />
              <span className="hidden sm:inline">{user?.name || '用户'}</span>
            </div>
          </Dropdown>
        </Header>

        <Content className="content-shell">
          <div className="page-surface fade-in-content">
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
}

function getPageTitle(pathname: string): string {
  const titles: Record<string, string> = {
    '/': '首页',
    '/interviews': '面试列表',
    '/my-registrations': '我的报名',
    '/questions': '题库',
    '/resources': '学习资源',
    '/profile': '个人中心',
    '/admin': '管理后台 · 仪表板',
    '/admin/interviews': '面试管理',
    '/admin/registrations': '报名管理',
    '/admin/questions': '题库管理',
    '/admin/classrooms': '教室管理',
    '/admin/users': '用户管理',
    '/interviewer': '面试官 · 仪表板',
    '/interviewer/slots': '我的场次',
  };

  return titles[pathname] || '面试系统';
}
