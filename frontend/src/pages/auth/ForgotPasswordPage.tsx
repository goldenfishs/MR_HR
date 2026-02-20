import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, Card, message, Steps } from 'antd';
import { MailOutlined, LockOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { authApi } from '../../services';

type StepType = 1 | 2 | 3;

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<StepType>(1);
  const [loading, setLoading] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [email, setEmail] = useState('');

  const sendVerificationCode = async () => {
    if (!email) {
      message.warning('请输入邮箱地址');
      return;
    }

    setSendingCode(true);
    try {
      await authApi.sendVerification(email, 'reset_password');
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

  const onEmailSubmit = (values: { email: string }) => {
    setEmail(values.email);
    setCurrentStep(2);
  };

  const onCodeSubmit = (values: { code: string }) => {
    setCurrentStep(3);
  };

  const onPasswordSubmit = async (values: { new_password: string }) => {
    const codeForm = document.querySelector('[data-step="code"]') as any;
    const code = codeForm?.getFieldValue('code');

    setLoading(true);
    try {
      await authApi.resetPassword(email, code, values.new_password);
      message.success('密码重置成功，请使用新密码登录');
      navigate('/login');
    } catch (error: any) {
      message.error(error.response?.data?.error || '密码重置失败');
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    {
      title: '验证邮箱',
      icon: <MailOutlined />,
    },
    {
      title: '验证身份',
      icon: <CheckCircleOutlined />,
    },
    {
      title: '重置密码',
      icon: <LockOutlined />,
    },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">重置密码</h1>
          <p className="text-gray-500">按照以下步骤重置您的密码</p>
        </div>

        <Steps current={currentStep - 1} items={steps} className="mb-8" />

        {currentStep === 1 && (
          <Form
            onFinish={onEmailSubmit}
            layout="vertical"
            autoComplete="off"
          >
            <Form.Item
              label="邮箱地址"
              name="email"
              rules={[
                { required: true, message: '请输入邮箱地址' },
                { type: 'email', message: '请输入有效的邮箱地址' },
              ]}
            >
              <Input
                prefix={<MailOutlined />}
                placeholder="请输入注册时使用的邮箱"
              />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" block>
                下一步
              </Button>
            </Form.Item>

            <div className="text-center">
              <Button type="link" onClick={() => navigate('/login')}>
                返回登录
              </Button>
            </div>
          </Form>
        )}

        {currentStep === 2 && (
          <Form
            data-step="code"
            onFinish={onCodeSubmit}
            layout="vertical"
            autoComplete="off"
          >
            <div className="mb-4 p-4 bg-blue-50 rounded">
              <p className="text-sm text-gray-600">
                我们已向 <strong>{email}</strong> 发送了验证码，请查收邮件并输入验证码。
              </p>
            </div>

            <Form.Item
              label="验证码"
              name="code"
              rules={[{ required: true, message: '请输入验证码' }]}
            >
              <div className="flex gap-2">
                <Input placeholder="请输入验证码" className="flex-1" />
                <Button
                  onClick={sendVerificationCode}
                  disabled={countdown > 0 || sendingCode}
                >
                  {countdown > 0 ? `${countdown}秒` : '重新发送'}
                </Button>
              </div>
            </Form.Item>

            <div className="flex gap-2">
              <Button onClick={() => setCurrentStep(1)}>
                上一步
              </Button>
              <Form.Item className="flex-1 mb-0">
                <Button type="primary" htmlType="submit" block>
                  下一步
                </Button>
              </Form.Item>
            </div>
          </Form>
        )}

        {currentStep === 3 && (
          <Form
            onFinish={onPasswordSubmit}
            layout="vertical"
            autoComplete="off"
          >
            <Form.Item
              label="新密码"
              name="new_password"
              rules={[
                { required: true, message: '请输入新密码' },
                { min: 6, message: '密码至少6个字符' },
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="请输入新密码（至少6个字符）"
              />
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
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="请再次输入新密码"
              />
            </Form.Item>

            <div className="flex gap-2">
              <Button onClick={() => setCurrentStep(2)}>
                上一步
              </Button>
              <Form.Item className="flex-1 mb-0">
                <Button type="primary" htmlType="submit" loading={loading} block>
                  重置密码
                </Button>
              </Form.Item>
            </div>
          </Form>
        )}
      </Card>
    </div>
  );
}
