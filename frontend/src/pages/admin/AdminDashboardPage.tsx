import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Row, Col, Statistic, Table, Tag, Typography, Button } from 'antd';
import {
  UserOutlined,
  CalendarOutlined,
  TeamOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { adminApi, registrationApi } from '../../services';
import { useAuthStore } from '../../store/authStore';
import type { Interview, Registration } from '../../types';
import dayjs from 'dayjs';

const { Title, Paragraph } = Typography;

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalInterviews: 0,
    publishedInterviews: 0,
    totalRegistrations: 0,
  });
  const [recentRegistrations, setRecentRegistrations] = useState<Registration[]>([]);
  const [upcomingInterviews, setUpcomingInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('AdminDashboardPage mounted');
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    console.log('Fetching dashboard data...');
    setLoading(true);
    try {
      const response = await adminApi.getDashboard();
      console.log('Dashboard response:', response.data);
      if (response.data.success) {
        setStats(response.data.data.stats);
        setRecentRegistrations(response.data.data.recentRegistrations || []);
        setUpcomingInterviews(response.data.data.upcomingInterviews || []);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'processing',
      confirmed: 'success',
      cancelled: 'default',
      completed: 'blue',
      failed: 'error',
      no_show: 'warning',
    };
    return colors[status] || 'default';
  };

  const getStatusText = (status: string) => {
    const texts: Record<string, string> = {
      pending: '待确认',
      confirmed: '已确认',
      cancelled: '已取消',
      completed: '已完成',
      failed: '未通过',
      no_show: '未到场',
    };
    return texts[status] || status;
  };

  const registrationColumns = [
    {
      title: '候选人',
      dataIndex: ['user', 'name'],
      key: 'user',
      render: (name: string, record: Registration) => (
        <div>
          <div className="font-medium">{name}</div>
          <div className="text-xs text-gray-500">{record.user?.email}</div>
        </div>
      ),
    },
    {
      title: '面试',
      dataIndex: ['interview', 'title'],
      key: 'interview',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>{getStatusText(status)}</Tag>
      ),
    },
    {
      title: '报名时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => dayjs(date).format('MM-DD HH:mm'),
    },
  ];

  const interviewColumns = [
    {
      title: '面试名称',
      dataIndex: 'title',
      key: 'title',
      render: (title: string, record: Interview) => (
        <div>
          <div className="font-medium">{title}</div>
          <div className="text-xs text-gray-500">{record.position}</div>
        </div>
      ),
    },
    {
      title: '日期',
      dataIndex: 'interview_date',
      key: 'interview_date',
      render: (date: string) => dayjs(date).format('YYYY-MM-DD'),
    },
    {
      title: '报名人数',
      dataIndex: 'registered_count',
      key: 'registered_count',
      render: (count: number, record: Interview) => (
        <span>
          {count || 0} / {record.capacity}
        </span>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const colors: Record<string, string> = {
          draft: 'default',
          published: 'green',
          closed: 'red',
          completed: 'blue',
        };
        const texts: Record<string, string> = {
          draft: '草稿',
          published: '报名中',
          closed: '已关闭',
          completed: '已结束',
        };
        return <Tag color={colors[status]}>{texts[status]}</Tag>;
      },
    },
  ];

  return (
    <div>
      <Title level={2} className="mb-2">
        管理后台
      </Title>
      <Paragraph className="text-gray-500 mb-6">
        查看系统概览和管理数据
      </Paragraph>

      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="总用户数"
              value={stats.totalUsers}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#1677ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="总面试数"
              value={stats.totalInterviews}
              prefix={<CalendarOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="进行中面试"
              value={stats.publishedInterviews}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="总报名数"
              value={stats.totalRegistrations}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card
            title="最近报名"
            extra={<Button type="link" onClick={() => navigate('/admin/registrations')}>查看全部</Button>}
          >
            <Table
              columns={registrationColumns}
              dataSource={recentRegistrations}
              rowKey="id"
              loading={loading}
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card
            title="即将开始的面试"
            extra={<Button type="link" onClick={() => navigate('/admin/interviews')}>查看全部</Button>}
          >
            <Table
              columns={interviewColumns}
              dataSource={upcomingInterviews}
              rowKey="id"
              loading={loading}
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
