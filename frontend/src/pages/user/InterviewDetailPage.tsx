import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Row,
  Col,
  Tag,
  Button,
  Descriptions,
  Modal,
  Form,
  Input,
  message,
  Alert,
  Spin,
  Space,
} from 'antd';
import {
  CalendarOutlined,
  EnvironmentOutlined,
  TeamOutlined,
  UserOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { interviewApi, registrationApi } from '../../services';
import { useAuthStore } from '../../store/authStore';
import type { Interview, InterviewSlot } from '../../types';
import dayjs from 'dayjs';

export default function InterviewDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const [interview, setInterview] = useState<Interview | null>(null);
  const [slots, setSlots] = useState<InterviewSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<InterviewSlot | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;

      setLoading(true);
      try {
        const [interviewRes, slotsRes] = await Promise.all([
          interviewApi.getById(parseInt(id)),
          interviewApi.getAvailableSlots(parseInt(id)),
        ]);

        if (interviewRes.data.success) {
          setInterview(interviewRes.data.data);
        }

        if (slotsRes.data.success) {
          setSlots(slotsRes.data.data);
        }

        // Check if already registered
        if (isAuthenticated && user) {
          const myRegsRes = await registrationApi.getMy();
          if (myRegsRes.data.success) {
            const registered = myRegsRes.data.data.some(
              (r: any) => r.interview_id === parseInt(id)
            );
            setIsRegistered(registered);
          }
        }
      } catch (error) {
        message.error('加载面试信息失败');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, isAuthenticated, user]);

  const handleRegister = (slot?: InterviewSlot) => {
    if (!isAuthenticated) {
      message.warning('请先登录');
      navigate('/login');
      return;
    }

    if (isRegistered) {
      message.info('您已报名该面试');
      return;
    }

    if (slot) {
      setSelectedSlot(slot);
    }
    setRegisterModalOpen(true);
  };

  const handleRegisterSubmit = async (values: { notes?: string }) => {
    if (!interview) return;

    setRegistering(true);
    try {
      await registrationApi.create({
        interview_id: interview.id,
        slot_id: selectedSlot?.id,
        notes: values.notes,
      });

      message.success('报名成功！');
      setIsRegistered(true);
      setRegisterModalOpen(false);
      form.resetFields();
    } catch (error: any) {
      message.error(error.response?.data?.error || '报名失败');
    } finally {
      setRegistering(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'default',
      published: 'green',
      closed: 'red',
      completed: 'blue',
    };
    return colors[status] || 'default';
  };

  const getStatusText = (status: string) => {
    const texts: Record<string, string> = {
      draft: '草稿',
      published: '报名中',
      closed: '已关闭',
      completed: '已结束',
    };
    return texts[status] || status;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spin size="large" />
      </div>
    );
  }

  if (!interview) {
    return (
      <Alert
        message="面试不存在"
        type="error"
        showIcon
        action={
          <Button type="primary" onClick={() => navigate('/interviews')}>
            返回列表
          </Button>
        }
      />
    );
  }

  const canRegister = interview.status === 'published' && !isRegistered;

  return (
    <div>
      <Button
        type="text"
        onClick={() => navigate(-1)}
        className="mb-4"
      >
        ← 返回
      </Button>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card>
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <h1 className="text-2xl font-bold text-gray-800">{interview.title}</h1>
                <Tag color={getStatusColor(interview.status)}>
                  {getStatusText(interview.status)}
                </Tag>
              </div>
              <p className="text-primary-600 text-lg font-medium">{interview.position}</p>
            </div>

            {interview.description && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">面试介绍</h3>
                <p className="text-gray-600">{interview.description}</p>
              </div>
            )}

            {interview.requirements && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">职位要求</h3>
                <p className="text-gray-600 whitespace-pre-line">{interview.requirements}</p>
              </div>
            )}

            <Descriptions column={2} bordered>
              <Descriptions.Item
                label={<span className="flex items-center"><CalendarOutlined className="mr-2" />面试日期</span>}
              >
                {dayjs(interview.interview_date).format('YYYY年MM月DD日')}
              </Descriptions.Item>
              <Descriptions.Item label="时间">
                {interview.start_time} - {interview.end_time}
              </Descriptions.Item>
              <Descriptions.Item
                label={<span className="flex items-center"><EnvironmentOutlined className="mr-2" />地点</span>}
              >
                {interview.location || '待定'}
              </Descriptions.Item>
              <Descriptions.Item
                label={<span className="flex items-center"><TeamOutlined className="mr-2" />名额</span>}
              >
                {interview.capacity} 人
              </Descriptions.Item>
              {interview.department && (
                <Descriptions.Item label="部门" span={2}>
                  {interview.department}
                </Descriptions.Item>
              )}
            </Descriptions>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card title="报名状态" className="mb-4">
            {isRegistered ? (
              <div className="text-center py-4">
                <CheckCircleOutlined className="text-4xl text-green-500 mb-2" />
                <p className="text-lg font-medium text-green-600">您已报名此面试</p>
                <Button
                  type="primary"
                  className="mt-4"
                  onClick={() => navigate('/my-registrations')}
                >
                  查看我的报名
                </Button>
              </div>
            ) : interview.status !== 'published' ? (
              <Alert
                message={interview.status === 'closed' ? '报名已截止' : '面试尚未开放报名'}
                type="info"
                showIcon
              />
            ) : (
              <div className="text-center">
                <p className="text-gray-500 mb-4">
                  已报名：{interview.registered_count || 0} / {interview.capacity}
                </p>
                <Button
                  type="primary"
                  size="large"
                  block
                  disabled={!canRegister}
                  onClick={() => handleRegister()}
                >
                  立即报名
                </Button>
              </div>
            )}
          </Card>

          {slots.length > 0 && canRegister && (
            <Card title="选择场次" className="mb-4">
              <Space direction="vertical" size="small" className="w-full">
                {slots.map((slot) => (
                  <Button
                    key={slot.id}
                    block
                    onClick={() => handleRegister(slot)}
                    className="text-left"
                  >
                    <div>
                      <div className="font-medium">
                        {dayjs(slot.date).format('MM月DD日')} {slot.start_time} - {slot.end_time}
                      </div>
                      <div className="text-xs text-gray-500">
                        {slot.booked_count} / {slot.capacity} 人已预约
                      </div>
                    </div>
                  </Button>
                ))}
              </Space>
            </Card>
          )}
        </Col>
      </Row>

      <Modal
        title="报名面试"
        open={registerModalOpen}
        onCancel={() => {
          setRegisterModalOpen(false);
          setSelectedSlot(null);
          form.resetFields();
        }}
        footer={null}
      >
        <Form form={form} onFinish={handleRegisterSubmit} layout="vertical">
          {selectedSlot && (
            <Alert
              message={`已选择场次：${dayjs(selectedSlot.date).format('MM月DD日')} ${selectedSlot.start_time} - ${selectedSlot.end_time}`}
              type="info"
              showIcon
              className="mb-4"
            />
          )}

          <Form.Item
            name="notes"
            label="备注（可选）"
          >
            <Input.TextArea
              rows={3}
              placeholder="如有特殊情况或需要说明的事项，请在此填写"
              maxLength={500}
              showCount
            />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={registering} block>
              确认报名
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
