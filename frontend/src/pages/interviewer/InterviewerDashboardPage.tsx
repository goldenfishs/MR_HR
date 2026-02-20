import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Row, Col, Statistic, Table, Tag, Typography, Button } from 'antd';
import {
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { interviewApi, registrationApi } from '../../services';
import { useAuthStore } from '../../store/authStore';
import type { InterviewSlot, Registration } from '../../types';
import dayjs from 'dayjs';

const { Title, Paragraph } = Typography;

export default function InterviewerDashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [mySlots, setMySlots] = useState<InterviewSlot[]>([]);
  const [pendingScores, setPendingScores] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch interviews where this interviewer is assigned
      // This would need a dedicated API endpoint, for now we'll fetch registrations
      const response = await registrationApi.getAll({
        pageSize: 100,
      });

      if (response.data.success) {
        const registrations = response.data.data.items;

        // Filter registrations that need scoring by this interviewer
        const pending = registrations.filter(
          (r: Registration) =>
            r.interview_score === undefined && ['confirmed', 'completed'].includes(r.status)
        );
        setPendingScores(pending);
      }

      // Mock slots data - in real app, fetch from API
      setMySlots([]);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const slotColumns = [
    {
      title: '面试',
      dataIndex: ['interview', 'title'],
      key: 'interview',
    },
    {
      title: '日期',
      dataIndex: 'date',
      key: 'date',
      render: (date: string) => dayjs(date).format('YYYY-MM-DD'),
    },
    {
      title: '时间',
      key: 'time',
      render: (_: any, record: InterviewSlot) => (
        <span>{record.start_time} - {record.end_time}</span>
      ),
    },
    {
      title: '教室',
      dataIndex: ['classroom', 'name'],
      key: 'classroom',
    },
    {
      title: '预约情况',
      key: 'booking',
      render: (_: any, record: InterviewSlot) => (
        <span>{record.booked_count} / {record.capacity}</span>
      ),
    },
  ];

  const scoringColumns = [
    {
      title: '候选人',
      dataIndex: ['user', 'name'],
      key: 'user',
      render: (name: string, record: Registration) => (
        <div>
          <div className="font-medium">{name}</div>
          <div className="text-xs text-gray-500">{record.user?.email}</div>
          {record.user?.student_id && (
            <div className="text-xs text-gray-400">学号：{record.user.student_id}</div>
          )}
        </div>
      ),
    },
    {
      title: '面试',
      dataIndex: ['interview', 'title'],
      key: 'interview',
    },
    {
      title: '面试时间',
      key: 'time',
      render: (_: any, record: Registration) => {
        if (record.slot) {
          return (
            <div>
              <div>{dayjs(record.slot.date).format('YYYY-MM-DD')}</div>
              <div className="text-xs text-gray-500">
                {record.slot.start_time} - {record.slot.end_time}
              </div>
            </div>
          );
        }
        return '-';
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const config: Record<string, { color: string; text: string }> = {
          completed: { color: 'blue', text: '已完成' },
          confirmed: { color: 'success', text: '已确认' },
        };
        const { color, text } = config[status] || { color: 'default', text: status };
        return <Tag color={color}>{text}</Tag>;
      },
    },
    {
      title: '操作',
      key: 'actions',
      render: (_: any, record: Registration) => (
        <Button
          type="link"
          onClick={() => navigate(`/interviewer/registrations/${record.id}/score`)}
        >
          {record.interview_score !== undefined ? '修改分数' : '评分'}
        </Button>
      ),
    },
  ];

  return (
    <div>
      <Title level={2} className="mb-2">
        面试官工作台
      </Title>
      <Paragraph className="text-gray-500 mb-6">
        欢迎回来，{user?.name}
      </Paragraph>

      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="今日场次"
              value={0}
              prefix={<CalendarOutlined />}
              valueStyle={{ color: '#1677ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="待评分"
              value={pendingScores.length}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="已完成评分"
              value={0}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="总面试人数"
              value={0}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card
            title="待评分面试"
            extra={<Button type="link" onClick={() => navigate('/interviewer/slots')}>查看全部</Button>}
          >
            <Table
              columns={scoringColumns}
              dataSource={pendingScores}
              rowKey="id"
              loading={loading}
              pagination={false}
              size="small"
            />
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card
            title="我的面试场次"
            extra={<Button type="link" onClick={() => navigate('/interviewer/slots')}>管理场次</Button>}
          >
            <Table
              columns={slotColumns}
              dataSource={mySlots}
              rowKey="id"
              loading={loading}
              pagination={false}
              locale={{ emptyText: '暂无安排的面试场次' }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
