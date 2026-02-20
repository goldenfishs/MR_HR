import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Card,
  Table,
  Tag,
  Button,
  Space,
  Select,
  Modal,
  Form,
  Input,
  InputNumber,
  message,
  Tabs,
  Descriptions,
} from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { registrationApi, interviewApi } from '../../services';
import type { Registration, Interview } from '../../types';
import dayjs from 'dayjs';

export default function AdminRegistrationsPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [scoringModalOpen, setScoringModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedRegistration, setSelectedRegistration] = useState<Registration | null>(null);
  const [scoringForm] = Form.useForm();
  const [filters, setFilters] = useState({
    interviewId: id ? parseInt(id) : undefined,
    status: '',
  });

  useEffect(() => {
    if (id) {
      fetchRegistrations();
    } else {
      fetchInterviews();
      fetchRegistrations();
    }
  }, [filters]);

  const fetchInterviews = async () => {
    try {
      const response = await interviewApi.getAll({ pageSize: 100 });
      if (response.data.success) {
        setInterviews(response.data.data.items);
      }
    } catch (error) {
      console.error('Failed to fetch interviews:', error);
    }
  };

  const fetchRegistrations = async () => {
    setLoading(true);
    try {
      const response = await registrationApi.getAll({
        interview_id: filters.interviewId,
        status: filters.status || undefined,
      });

      if (response.data.success) {
        setRegistrations(response.data.data.items);
      }
    } catch (error) {
      console.error('Failed to fetch registrations:', error);
    } finally {
      setLoading(false);
    }
  };

  const openScoringModal = (registration: Registration) => {
    setSelectedRegistration(registration);
    scoringForm.setFieldsValue({
      score: registration.interview_score,
      feedback: registration.interview_feedback,
    });
    setScoringModalOpen(true);
  };

  const handleScoreSubmit = async (values: { score: number; feedback?: string }) => {
    if (!selectedRegistration) return;

    try {
      await registrationApi.score(selectedRegistration.id, values.score, values.feedback);
      message.success('评分提交成功');
      setScoringModalOpen(false);
      fetchRegistrations();
    } catch (error: any) {
      message.error(error.response?.data?.error || '评分失败');
    }
  };

  const handleAnnounceResult = async (registration: Registration) => {
    Modal.confirm({
      title: '确认公布结果',
      content: `确定要向 ${registration.user?.name} 公布面试结果吗？`,
      onOk: async () => {
        try {
          await registrationApi.announce(registration.id);
          message.success('结果已公布');
          fetchRegistrations();
        } catch (error: any) {
          message.error(error.response?.data?.error || '操作失败');
        }
      },
    });
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

  const columns = [
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
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>{getStatusText(status)}</Tag>
      ),
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
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => {
              setSelectedRegistration(record);
              setDetailModalOpen(true);
            }}
          >
            详情
          </Button>
          {record.status === 'pending' && (
            <Button
              type="link"
              size="small"
              onClick={async () => {
                try {
                  await registrationApi.updateStatus(record.id, 'confirmed');
                  message.success('已确认报名');
                  fetchRegistrations();
                } catch (error: any) {
                  message.error(error.response?.data?.error || '确认失败');
                }
              }}
            >
              确认
            </Button>
          )}
          {['confirmed', 'completed'].includes(record.status) && (
            <Button
              type="link"
              size="small"
              onClick={() => openScoringModal(record)}
            >
              {record.interview_score !== undefined ? '修改分数' : '评分'}
            </Button>
          )}
          {record.interview_score !== undefined && !record.result_announced && (
            <Button
              type="link"
              size="small"
              onClick={() => handleAnnounceResult(record)}
            >
              公布结果
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">报名管理</h1>
        <p className="text-gray-500">查看和管理面试报名</p>
      </div>

      <Card>
        {!id && (
          <div className="mb-4">
            <Select
              placeholder="筛选面试"
              allowClear
              style={{ width: 300 }}
              onChange={(value) => {
                setFilters({ ...filters, interviewId: value || undefined });
              }}
            >
              {interviews.map((interview) => (
                <Select.Option key={interview.id} value={interview.id}>
                  {interview.title} - {interview.position}
                </Select.Option>
              ))}
            </Select>
            <Select
              placeholder="筛选状态"
              allowClear
              style={{ width: 150, marginLeft: 16 }}
              onChange={(value) => {
                setFilters({ ...filters, status: value || '' });
              }}
            >
              <Select.Option value="pending">待确认</Select.Option>
              <Select.Option value="confirmed">已确认</Select.Option>
              <Select.Option value="completed">已完成</Select.Option>
              <Select.Option value="cancelled">已取消</Select.Option>
            </Select>
          </div>
        )}

        <Table
          columns={columns}
          dataSource={registrations}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
        />
      </Card>

      <Modal
        title="面试评分"
        open={scoringModalOpen}
        onCancel={() => {
          setScoringModalOpen(false);
          setSelectedRegistration(null);
          scoringForm.resetFields();
        }}
        footer={null}
      >
        {selectedRegistration && (
          <div className="mb-4 p-3 bg-gray-50 rounded">
            <p><strong>候选人：</strong>{selectedRegistration.user?.name}</p>
            <p><strong>面试：</strong>{selectedRegistration.interview?.title}</p>
          </div>
        )}

        <Form
          form={scoringForm}
          layout="vertical"
          onFinish={handleScoreSubmit}
        >
          <Form.Item
            label="面试分数"
            name="score"
            rules={[
              { required: true, message: '请输入分数' },
              { type: 'number', min: 0, max: 100, message: '分数范围为0-100' },
            ]}
          >
            <InputNumber min={0} max={100} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            label="面试反馈"
            name="feedback"
          >
            <Input.TextArea
              rows={4}
              placeholder="请输入面试反馈（可选）"
            />
          </Form.Item>

          <Form.Item className="mb-0">
            <Button type="primary" htmlType="submit" block>
              提交评分
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="报名详情"
        open={detailModalOpen}
        onCancel={() => {
          setDetailModalOpen(false);
          setSelectedRegistration(null);
        }}
        footer={[
          <Button key="close" onClick={() => setDetailModalOpen(false)}>
            关闭
          </Button>,
        ]}
        width={600}
      >
        {selectedRegistration && (
          <Descriptions column={2} bordered size="small">
            <Descriptions.Item label="候选人" span={2}>
              {selectedRegistration.user?.name} ({selectedRegistration.user?.email})
            </Descriptions.Item>
            {selectedRegistration.user?.student_id && (
              <Descriptions.Item label="学号">
                {selectedRegistration.user.student_id}
              </Descriptions.Item>
            )}
            {selectedRegistration.user?.major && (
              <Descriptions.Item label="专业">
                {selectedRegistration.user.major}
              </Descriptions.Item>
            )}
            <Descriptions.Item label="面试" span={2}>
              {selectedRegistration.interview?.title}
            </Descriptions.Item>
            {selectedRegistration.notes && (
              <Descriptions.Item label="备注" span={2}>
                {selectedRegistration.notes}
              </Descriptions.Item>
            )}
            {selectedRegistration.resume_url && (
              <Descriptions.Item label="简历" span={2}>
                <a href={selectedRegistration.resume_url} target="_blank" rel="noopener noreferrer">
                  查看简历
                </a>
              </Descriptions.Item>
            )}
          </Descriptions>
        )}
      </Modal>
    </div>
  );
}
