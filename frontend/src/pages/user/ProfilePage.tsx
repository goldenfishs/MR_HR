import { useState, useEffect } from 'react';
import {
  Card,
  Form,
  Input,
  Button,
  message,
  Avatar,
  Descriptions,
  Row,
  Col,
  Modal,
} from 'antd';
import {
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  IdcardOutlined,
  EditOutlined,
  LockOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '../../store/authStore';
import { userApi, authApi } from '../../services';

export default function ProfilePage() {
  const { user, setUser } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [passwordForm] = Form.useForm();

  useEffect(() => {
    if (user) {
      form.setFieldsValue({
        name: user.name,
        email: user.email,
        phone: user.phone,
        student_id: user.student_id,
        major: user.major,
        grade: user.grade,
      });
    }
  }, [user, form]);

  const handleProfileUpdate = async (values: any) => {
    setLoading(true);
    try {
      const response = await userApi.updateProfile(values);
      if (response.data.success) {
        setUser(response.data.data);
        message.success('个人信息更新成功');
        setEditMode(false);
      }
    } catch (error: any) {
      message.error(error.response?.data?.error || '更新失败');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (values: {
    old_password: string;
    new_password: string;
  }) => {
    setLoading(true);
    try {
      await authApi.changePassword(values.old_password, values.new_password);
      message.success('密码修改成功，请重新登录');
      setPasswordModalOpen(false);
      passwordForm.resetFields();
    } catch (error: any) {
      message.error(error.response?.data?.error || '密码修改失败');
    } finally {
      setLoading(false);
    }
  };

  const getRoleText = (role: string) => {
    const roles: Record<string, string> = {
      user: '普通用户',
      admin: '管理员',
      interviewer: '面试官',
    };
    return roles[role] || role;
  };

  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      user: 'blue',
      admin: 'red',
      interviewer: 'green',
    };
    return colors[role] || 'default';
  };

  if (!user) {
    return null;
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">个人中心</h1>
        <p className="text-gray-500">管理您的个人信息和设置</p>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <Card>
            <div className="text-center">
              <Avatar size={80} icon={<UserOutlined />} src={user.avatar} />
              <h2 className="text-xl font-semibold mt-3">{user.name}</h2>
              <p className="text-gray-500">{getRoleText(user.role)}</p>
              <div className="mt-4">
                <Button
                  type="primary"
                  icon={<EditOutlined />}
                  onClick={() => setEditMode(!editMode)}
                  block
                >
                  {editMode ? '取消编辑' : '编辑资料'}
                </Button>
              </div>
            </div>

            <Descriptions column={1} className="mt-6">
              <Descriptions.Item label="邮箱">
                <span className="flex items-center">
                  <MailOutlined className="mr-2" />
                  {user.email}
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="邮箱验证">
                {user.is_verified ? (
                  <span className="text-green-500">已验证</span>
                ) : (
                  <span className="text-orange-500">未验证</span>
                )}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>

        <Col xs={24} md={16}>
          <Card
            title="个人信息"
            extra={
              <Button
                type="link"
                icon={<LockOutlined />}
                onClick={() => setPasswordModalOpen(true)}
              >
                修改密码
              </Button>
            }
          >
            {editMode ? (
              <Form
                form={form}
                layout="vertical"
                onFinish={handleProfileUpdate}
              >
                <Form.Item
                  label="姓名"
                  name="name"
                  rules={[{ required: true, message: '请输入姓名' }]}
                >
                  <Input prefix={<UserOutlined />} />
                </Form.Item>

                <Form.Item label="手机号" name="phone">
                  <Input prefix={<PhoneOutlined />} />
                </Form.Item>

                <Form.Item label="学号" name="student_id">
                  <Input prefix={<IdcardOutlined />} />
                </Form.Item>

                <Form.Item label="专业" name="major">
                  <Input />
                </Form.Item>

                <Form.Item label="年级" name="grade">
                  <Input placeholder="如：2021级" />
                </Form.Item>

                <Form.Item>
                  <Button type="primary" htmlType="submit" loading={loading} block>
                    保存修改
                  </Button>
                </Form.Item>
              </Form>
            ) : (
              <Descriptions column={2} bordered>
                <Descriptions.Item label="姓名" span={2}>
                  {user.name}
                </Descriptions.Item>
                <Descriptions.Item label="邮箱" span={2}>
                  {user.email}
                </Descriptions.Item>
                <Descriptions.Item label="手机号" span={2}>
                  {user.phone || '未设置'}
                </Descriptions.Item>
                <Descriptions.Item label="学号" span={1}>
                  {user.student_id || '未设置'}
                </Descriptions.Item>
                <Descriptions.Item label="年级" span={1}>
                  {user.grade || '未设置'}
                </Descriptions.Item>
                <Descriptions.Item label="专业" span={2}>
                  {user.major || '未设置'}
                </Descriptions.Item>
                <Descriptions.Item label="角色" span={2}>
                  <span style={{ color: getRoleColor(user.role) }}>
                    {getRoleText(user.role)}
                  </span>
                </Descriptions.Item>
                <Descriptions.Item label="注册时间" span={2}>
                  {new Date(user.created_at).toLocaleString('zh-CN')}
                </Descriptions.Item>
              </Descriptions>
            )}
          </Card>
        </Col>
      </Row>

      <Modal
        title="修改密码"
        open={passwordModalOpen}
        onCancel={() => {
          setPasswordModalOpen(false);
          passwordForm.resetFields();
        }}
        footer={null}
      >
        <Form
          form={passwordForm}
          layout="vertical"
          onFinish={handlePasswordChange}
        >
          <Form.Item
            label="当前密码"
            name="old_password"
            rules={[{ required: true, message: '请输入当前密码' }]}
          >
            <Input.Password prefix={<LockOutlined />} />
          </Form.Item>

          <Form.Item
            label="新密码"
            name="new_password"
            rules={[
              { required: true, message: '请输入新密码' },
              { min: 6, message: '密码至少6个字符' },
            ]}
          >
            <Input.Password prefix={<LockOutlined />} />
          </Form.Item>

          <Form.Item
            label="确认新密码"
            name="confirm_password"
            dependencies={['new_password']}
            rules={[
              { required: true, message: '请确认新密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('new_password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('两次输入的密码不一致'));
                },
              }),
            ]}
          >
            <Input.Password prefix={<LockOutlined />} />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              确认修改
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
