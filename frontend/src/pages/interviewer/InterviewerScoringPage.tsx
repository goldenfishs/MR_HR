import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Form,
  InputNumber,
  Input,
  Button,
  message,
  Descriptions,
  Spin,
  Tag,
  Space,
} from 'antd';
import { SaveOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { registrationApi } from '../../services';
import type { Registration } from '../../types';
import dayjs from 'dayjs';

export default function InterviewerScoringPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [registration, setRegistration] = useState<Registration | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    if (id) {
      fetchRegistration();
    }
  }, [id]);

  const fetchRegistration = async () => {
    if (!id) {
      navigate('/interviewer');
      return;
    }

    setLoading(true);
    try {
      const response = await registrationApi.getById(parseInt(id, 10));
      if (response.data.success) {
        setRegistration(response.data.data);
        form.setFieldsValue({
          score: response.data.data.interview_score,
          feedback: response.data.data.interview_feedback,
        });
      }
    } catch (error) {
      message.error('加载报名信息失败');
      navigate('/interviewer');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values: { score: number; feedback?: string }) => {
    setSubmitting(true);
    try {
      await registrationApi.score(parseInt(id!), values.score, values.feedback);
      message.success('评分提交成功');
      navigate('/interviewer');
    } catch (error: any) {
      message.error(error.response?.data?.error || '评分失败');
    } finally {
      setSubmitting(false);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spin size="large" />
      </div>
    );
  }

  if (!registration) {
    return (
      <Card>
        <div className="text-center py-8 text-gray-500">报名信息不存在</div>
      </Card>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate(-1)}
          >
            返回
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">面试评分</h1>
            <p className="text-gray-500">为候选人打分并提供反馈</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card title="评分表" className="mb-6">
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmit}
            >
              <Form.Item
                label="面试分数"
                name="score"
                rules={[
                  { required: true, message: '请输入分数' },
                  { type: 'number', min: 0, max: 100, message: '分数范围为0-100' },
                ]}
              >
                <InputNumber
                  min={0}
                  max={100}
                  size="large"
                  style={{ width: '100%' }}
                  placeholder="请输入0-100的分数"
                />
              </Form.Item>

              <Form.Item
                label="面试反馈"
                name="feedback"
                tooltip="反馈将会在结果公布后显示给候选人"
              >
                <Input.TextArea
                  rows={8}
                  placeholder="请输入面试反馈，包括候选人的表现、优点、需要改进的地方等..."
                  maxLength={2000}
                  showCount
                />
              </Form.Item>

              <Form.Item className="mb-0">
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={submitting}
                  icon={<SaveOutlined />}
                  size="large"
                >
                  提交评分
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </div>

        <div>
          <Card title="候选人信息" className="mb-6">
            <Descriptions column={1} size="small">
              <Descriptions.Item label="姓名">
                {registration.user?.name}
              </Descriptions.Item>
              <Descriptions.Item label="邮箱">
                {registration.user?.email}
              </Descriptions.Item>
              {registration.user?.student_id && (
                <Descriptions.Item label="学号">
                  {registration.user.student_id}
                </Descriptions.Item>
              )}
              {registration.user?.major && (
                <Descriptions.Item label="专业">
                  {registration.user.major}
                </Descriptions.Item>
              )}
              {registration.user?.grade && (
                <Descriptions.Item label="年级">
                  {registration.user.grade}
                </Descriptions.Item>
              )}
              {registration.user?.phone && (
                <Descriptions.Item label="手机">
                  {registration.user.phone}
                </Descriptions.Item>
              )}
            </Descriptions>
          </Card>

          <Card title="面试信息">
            <Descriptions column={1} size="small">
              <Descriptions.Item label="面试名称">
                {registration.interview?.title}
              </Descriptions.Item>
              <Descriptions.Item label="应聘职位">
                {registration.interview?.position}
              </Descriptions.Item>
              <Descriptions.Item label="面试状态">
                <Tag color={getStatusColor(registration.status)}>
                  {getStatusText(registration.status)}
                </Tag>
              </Descriptions.Item>
              {registration.slot ? (
                <>
                  <Descriptions.Item label="面试日期">
                    {dayjs(registration.slot.date).format('YYYY年MM月DD日')}
                  </Descriptions.Item>
                  <Descriptions.Item label="面试时间">
                    {registration.slot.start_time} - {registration.slot.end_time}
                  </Descriptions.Item>
                  {registration.slot.classroom && (
                    <Descriptions.Item label="面试地点">
                      {registration.slot.classroom.name}
                      <br />
                      <span className="text-xs text-gray-500">
                        {registration.slot.classroom.location}
                      </span>
                    </Descriptions.Item>
                  )}
                </>
              ) : (
                <>
                  <Descriptions.Item label="面试日期">
                    {registration.interview?.interview_date &&
                      dayjs(registration.interview.interview_date).format('YYYY年MM月DD日')
                    }
                  </Descriptions.Item>
                  <Descriptions.Item label="面试时间">
                    {registration.interview?.start_time} - {registration.interview?.end_time}
                  </Descriptions.Item>
                  <Descriptions.Item label="面试地点">
                    {registration.interview?.location || '待定'}
                  </Descriptions.Item>
                </>
              )}
            </Descriptions>

            {registration.notes && (
              <div className="mt-4 p-3 bg-gray-50 rounded">
                <div className="text-sm font-medium text-gray-700 mb-1">备注：</div>
                <div className="text-sm text-gray-600 whitespace-pre-line">
                  {registration.notes}
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
