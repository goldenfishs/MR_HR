import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Form,
  Input,
  DatePicker,
  InputNumber,
  Button,
  message,
  Row,
  Col,
  Select,
} from 'antd';
import { SaveOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { interviewApi } from '../../services';
import type { Interview } from '../../types';
import dayjs from 'dayjs';

const { TextArea } = Input;
const { Option } = Select;

export default function AdminInterviewFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(false);

  useEffect(() => {
    if (id) {
      fetchInterview();
    }
  }, [id]);

  const fetchInterview = async () => {
    if (!id) {
      return;
    }

    setFetchLoading(true);
    try {
      const response = await interviewApi.getById(parseInt(id, 10));
      if (response.data.success) {
        const interview = response.data.data;
        form.setFieldsValue({
          ...interview,
          interview_date: dayjs(interview.interview_date),
        });
      }
    } catch (error) {
      message.error('加载面试信息失败');
      navigate('/admin/interviews');
    } finally {
      setFetchLoading(false);
    }
  };

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      const data = {
        ...values,
        interview_date: values.interview_date.format('YYYY-MM-DD'),
      };

      if (isEdit) {
        await interviewApi.update(parseInt(id!), data);
        message.success('面试更新成功');
      } else {
        await interviewApi.create(data);
        message.success('面试创建成功');
      }
      navigate('/admin/interviews');
    } catch (error: any) {
      message.error(error.response?.data?.error || '操作失败');
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading) {
    return <div className="text-center py-12">加载中...</div>;
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/admin/interviews')}
          >
            返回
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              {isEdit ? '编辑面试' : '创建面试'}
            </h1>
            <p className="text-gray-500">
              {isEdit ? '修改面试信息' : '填写面试相关信息'}
            </p>
          </div>
        </div>
      </div>

      <Card>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            status: 'draft',
            capacity: 1,
          }}
        >
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                label="面试标题"
                name="title"
                rules={[
                  { required: true, message: '请输入面试标题' },
                  { min: 5, message: '标题至少5个字符' },
                ]}
              >
                <Input placeholder="请输入面试标题" />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                label="招聘职位"
                name="position"
                rules={[{ required: true, message: '请输入招聘职位' }]}
              >
                <Input placeholder="如：前端开发工程师" />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                label="部门"
                name="department"
              >
                <Input placeholder="请输入部门名称" />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                label="招聘人数"
                name="capacity"
                rules={[{ required: true, message: '请输入招聘人数' }]}
              >
                <InputNumber min={1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                label="面试日期"
                name="interview_date"
                rules={[{ required: true, message: '请选择面试日期' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>

            <Col xs={24} md={6}>
              <Form.Item
                label="开始时间"
                name="start_time"
                rules={[{ required: true, message: '请选择开始时间' }]}
              >
                <Input placeholder="如：09:00" />
              </Form.Item>
            </Col>

            <Col xs={24} md={6}>
              <Form.Item
                label="结束时间"
                name="end_time"
                rules={[{ required: true, message: '请选择结束时间' }]}
              >
                <Input placeholder="如：17:00" />
              </Form.Item>
            </Col>

            <Col xs={24}>
              <Form.Item
                label="面试地点"
                name="location"
              >
                <Input placeholder="请输入面试地点" />
              </Form.Item>
            </Col>

            <Col xs={24}>
              <Form.Item
                label="面试介绍"
                name="description"
              >
                <TextArea rows={3} placeholder="请输入面试介绍" />
              </Form.Item>
            </Col>

            <Col xs={24}>
              <Form.Item
                label="职位要求"
                name="requirements"
              >
                <TextArea rows={4} placeholder="请输入职位要求" />
              </Form.Item>
            </Col>

            {isEdit && (
              <Col xs={24} md={12}>
                <Form.Item
                  label="状态"
                  name="status"
                >
                  <Select>
                    <Option value="draft">草稿</Option>
                    <Option value="published">报名中</Option>
                    <Option value="closed">已关闭</Option>
                    <Option value="completed">已结束</Option>
                  </Select>
                </Form.Item>
              </Col>
            )}
          </Row>

          <Form.Item className="mb-0">
            <Button type="primary" htmlType="submit" loading={loading} icon={<SaveOutlined />}>
              {isEdit ? '保存修改' : '创建面试'}
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
