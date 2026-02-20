import { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Tag,
  Button,
  Modal,
  message,
  Empty,
  Tabs,
  Descriptions,
  Space,
} from 'antd';
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import { registrationApi } from '../../services';
import type { Registration } from '../../types';
import dayjs from 'dayjs';

export default function MyRegistrationsPage() {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    fetchRegistrations();
  }, []);

  const fetchRegistrations = async () => {
    setLoading(true);
    try {
      const response = await registrationApi.getMy();
      if (response.data.success) {
        setRegistrations(response.data.data);
      }
    } catch (error) {
      message.error('加载报名记录失败');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = (id: number, interviewTitle: string) => {
    Modal.confirm({
      title: '确认取消报名',
      content: `确定要取消「${interviewTitle}」的报名吗？此操作不可撤销。`,
      okText: '确认取消',
      okType: 'danger',
      cancelText: '再想想',
      onOk: async () => {
        setCancelling(true);
        try {
          await registrationApi.cancel(id);
          message.success('已取消报名');
          fetchRegistrations();
        } catch (error: any) {
          message.error(error.response?.data?.error || '取消失败');
        } finally {
          setCancelling(false);
        }
      },
    });
  };

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { color: string; icon: React.ReactNode; text: string }> = {
      pending: {
        color: 'processing',
        icon: <ClockCircleOutlined />,
        text: '待确认',
      },
      confirmed: {
        color: 'success',
        icon: <CheckCircleOutlined />,
        text: '已确认',
      },
      cancelled: {
        color: 'default',
        icon: <CloseCircleOutlined />,
        text: '已取消',
      },
      completed: {
        color: 'blue',
        icon: <CheckCircleOutlined />,
        text: '已完成',
      },
      failed: {
        color: 'error',
        icon: <CloseCircleOutlined />,
        text: '未通过',
      },
      no_show: {
        color: 'warning',
        icon: <ExclamationCircleOutlined />,
        text: '未到场',
      },
    };
    return configs[status] || { color: 'default', icon: null, text: status };
  };

  const columns = [
    {
      title: '面试名称',
      dataIndex: ['interview', 'title'],
      key: 'title',
      render: (title: string, record: Registration) => (
        <div>
          <div className="font-medium">{title}</div>
          <div className="text-xs text-gray-500">{record.interview?.position}</div>
        </div>
      ),
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
        return (
          <div>
            <div>{dayjs(record.interview?.interview_date).format('YYYY-MM-DD')}</div>
            <div className="text-xs text-gray-500">
              {record.interview?.start_time} - {record.interview?.end_time}
            </div>
          </div>
        );
      },
    },
    {
      title: '地点',
      key: 'location',
      render: (_: any, record: Registration) => {
        const location = record.slot?.classroom?.location || record.interview?.location;
        const name = record.slot?.classroom?.name;
        return name ? (
          <div>
            <div>{name}</div>
            <div className="text-xs text-gray-500">{location}</div>
          </div>
        ) : (
          location || '待定'
        );
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const config = getStatusConfig(status);
        return (
          <Tag color={config.color} icon={config.icon}>
            {config.text}
          </Tag>
        );
      },
    },
    {
      title: '面试结果',
      key: 'result',
      render: (_: any, record: Registration) => {
        if (!record.result_announced) {
          return <span className="text-gray-400">未公布</span>;
        }
        if (record.interview_score !== undefined) {
          const passed = record.interview_score >= 60;
          return (
            <Space>
              <Tag color={passed ? 'success' : 'error'}>
                {passed ? '通过' : '未通过'}
              </Tag>
              <span>{record.interview_score} 分</span>
            </Space>
          );
        }
        return '-';
      },
    },
    {
      title: '操作',
      key: 'actions',
      render: (_: any, record: Registration) => (
        <Space>
          {['pending', 'confirmed'].includes(record.status) && (
            <Button
              type="link"
              danger
              size="small"
              onClick={() => handleCancel(record.id, record.interview?.title || '')}
              loading={cancelling}
            >
              取消报名
            </Button>
          )}
          {record.result_announced && record.interview_feedback && (
            <Button
              type="link"
              size="small"
              onClick={() => {
                Modal.info({
                  title: '面试反馈',
                  content: (
                    <div>
                      <p>分数：{record.interview_score} 分</p>
                      <p>反馈：</p>
                      <p className="whitespace-pre-line">{record.interview_feedback}</p>
                    </div>
                  ),
                  width: 500,
                });
              }}
            >
              查看反馈
            </Button>
          )}
        </Space>
      ),
    },
  ];

  const filteredRegistrations = registrations.filter((r) => {
    if (activeTab === 'all') return true;
    return r.status === activeTab;
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">我的报名</h1>
        <p className="text-gray-500">查看您报名的面试及进度</p>
      </div>

      <Card>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            { key: 'all', label: '全部' },
            { key: 'pending', label: '待确认' },
            { key: 'confirmed', label: '已确认' },
            { key: 'completed', label: '已完成' },
            { key: 'cancelled', label: '已取消' },
          ]}
        />

        <Table
          columns={columns}
          dataSource={filteredRegistrations}
          rowKey="id"
          loading={loading}
          locale={{
            emptyText: (
              <Empty
                description={
                  activeTab === 'all'
                    ? '您还没有报名任何面试'
                    : `没有${activeTab === 'pending' ? '待确认' : activeTab === 'confirmed' ? '已确认' : activeTab === 'completed' ? '已完成' : '已取消'}的报名`
                }
              />
            ),
          }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
        />
      </Card>
    </div>
  );
}
