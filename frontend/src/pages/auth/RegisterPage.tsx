import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, Card, message, Progress } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, PhoneOutlined, IdcardOutlined } from '@ant-design/icons';
import { authApi } from '../../services';

interface RegisterFormValues {
  email: string;
  password: string;
  confirmPassword: string;
  name: string;
  verification_code: string;
  phone?: string;
  student_id?: string;
  major?: string;
  grade?: string;
}

export default function RegisterPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [passwordStrength, setPasswordStrength] = useState(0);

  const [form] = Form.useForm<RegisterFormValues>();

  const calculatePasswordStrength = (password: string): number => {
    let strength = 0;
    if (password.length >= 6) strength += 25;
    if (password.length >= 10) strength += 25;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password) || /[^a-zA-Z0-9]/.test(password)) strength += 25;
    return strength;
  };

  const getPasswordStrengthColor = (strength: number): string => {
    if (strength < 30) return '#ff4d4f';
    if (strength < 60) return '#faad14';
    if (strength < 80) return '#1890ff';
    return '#52c41a';
  };

  const sendVerificationCode = async () => {
    const email = form.getFieldValue('email');
    if (!email) {
      message.warning('请输入邮箱地址');
      return;
    }

    try {
      await form.validateFields(['email']);
    } catch {
      return;
    }

    setSendingCode(true);
    try {
      await authApi.sendVerification(email, 'register');
      message.success('验证码已发送到您的邮箱');

      setCountdown(60);
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error: any) {
      message.error(error.response?.data?.error || '发送验证码失败');
    } finally {
      setSendingCode(false);
    }
  };

  const onFinish = async (values: RegisterFormValues) => {
    setLoading(true);
    try {
      const { confirmPassword, ...data } = values;
      const response = await authApi.register(data);

      if (response.data.success) {
        message.success('注册成功，请登录');
        navigate('/login');
      }
    } catch (error: any) {
      message.error(error.response?.data?.error || '注册失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-lg shadow-lg">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">创建账户</h1>
          <p className="text-gray-500">填写以下信息完成注册</p>
        </div>

        <Form
          form={form}
          name="register"
          onFinish={onFinish}
          autoComplete="off"
          layout="vertical"
        >
          <Form.Item
            label="邮箱地址"
            name="email"
            rules={[
              { required: true, message: '请输入邮箱地址' },
              { type: 'email', message: '请输入有效的邮箱地址' },
            ]}
          >
            <Input prefix={<MailOutlined />} placeholder="请输入邮箱地址" />
          </Form.Item>

          <Form.Item
            label="验证码"
            name="verification_code"
            rules={[{ required: true, message: '请输入验证码' }]}
          >
            <div className="flex gap-2">
              <Input placeholder="请输入验证码" className="flex-1" />
              <Button
                onClick={sendVerificationCode}
                disabled={countdown > 0 || sendingCode}
              >
                {countdown > 0 ? `${countdown}秒` : '发送验证码'}
              </Button>
            </div>
          </Form.Item>

          <Form.Item
            label="密码"
            name="password"
            rules={[
              { required: true, message: '请输入密码' },
              { min: 6, message: '密码至少6个字符' },
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="请输入密码"
              onChange={(e) => setPasswordStrength(calculatePasswordStrength(e.target.value))}
            />
          </Form.Item>

          {passwordStrength > 0 && (
            <div className="mb-4">
              <Progress
                percent={passwordStrength}
                strokeColor={getPasswordStrengthColor(passwordStrength)}
                showInfo={false}
                size="small"
              />
              <p className="text-xs text-gray-500 mt-1">
                密码强度：{passwordStrength < 30 ? '弱' : passwordStrength < 60 ? '中' : passwordStrength < 80 ? '强' : '很强'}
              </p>
            </div>
          )}

          <Form.Item
            label="确认密码"
            name="confirmPassword"
            dependencies={['password']}
            rules={[
              { required: true, message: '请确认密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('两次输入的密码不一致'));
                },
              }),
            ]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="请再次输入密码" />
          </Form.Item>

          <Form.Item
            label="姓名"
            name="name"
            rules={[
              { required: true, message: '请输入姓名' },
              { min: 2, message: '姓名至少2个字符' },
            ]}
          >
            <Input prefix={<UserOutlined />} placeholder="请输入姓名" />
          </Form.Item>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item label="学号" name="student_id">
              <Input prefix={<IdcardOutlined />} placeholder="请输入学号" />
            </Form.Item>

            <Form.Item label="年级" name="grade">
              <Input placeholder="如：2021级" />
            </Form.Item>
          </div>

          <Form.Item label="专业" name="major">
            <Input placeholder="请输入专业" />
          </Form.Item>

          <Form.Item label="手机号" name="phone">
            <Input prefix={<PhoneOutlined />} placeholder="请输入手机号" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block size="large">
              注册
            </Button>
          </Form.Item>

          <div className="text-center text-gray-500">
            已有账户？{' '}
            <Button type="link" onClick={() => navigate('/login')} className="p-0">
              立即登录
            </Button>
          </div>
        </Form>
      </Card>
    </div>
  );
}
