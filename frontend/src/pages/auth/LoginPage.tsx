import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Form, Input, Button, Card, message, Tabs } from 'antd';
import {
  UserOutlined,
  LockOutlined,
  MailOutlined,
  SafetyCertificateOutlined,
  ThunderboltOutlined,
  RocketOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '../../store/authStore';
import { authApi } from '../../services';

type TabType = 'password' | 'code';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setAuth } = useAuthStore();
  const [codeForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('password');
  const [sendingCode, setSendingCode] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const from = (location.state as any)?.from?.pathname || '/';

  const onPasswordFinish = async (values: { email: string; password: string }) => {
    setLoading(true);
    try {
      const response = await authApi.login(values.email, values.password);

      if (response.data.success && response.data.data) {
        const { user, accessToken, refreshToken } = response.data.data;
        setAuth(user, accessToken, refreshToken);
        message.success('登录成功');

        const targetPath = user.role === 'admin' ? '/admin' : user.role === 'interviewer' ? '/interviewer' : from;
        navigate(targetPath, { replace: true });
      }
    } catch (error: any) {
      message.error(error.response?.data?.error || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  const onCodeFinish = async (_values: { email: string; code: string }) => {
    setLoading(true);
    try {
      message.info('验证码登录功能待实现');
    } catch (error: any) {
      message.error(error.response?.data?.error || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  const sendVerificationCode = async (email: string) => {
    if (!email) {
      message.warning('请输入邮箱地址');
      return;
    }

    setSendingCode(true);
    try {
      await authApi.sendVerification(email, 'login');
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

  return (
    <div className="auth-stage">
      <div className="auth-panel fade-in-content">
        <section className="auth-hero">
          <div>
            <div className="auth-kicker">Interview Studio</div>
            <h2>把面试流程
              <br />
              变成顺滑体验</h2>
            <p>统一报名、排期、评分与结果发布，用更少操作完成更多管理工作。</p>
          </div>

          <div className="auth-feature-list">
            <div className="auth-feature">
              <SafetyCertificateOutlined />
              <span><strong>权限分级</strong>，管理端与面试官视图严格隔离</span>
            </div>
            <div className="auth-feature">
              <ThunderboltOutlined />
              <span><strong>流畅交互</strong>，支持快速检索与批量处理</span>
            </div>
            <div className="auth-feature">
              <RocketOutlined />
              <span><strong>实时状态</strong>，报名到结果发布全链路可追踪</span>
            </div>
          </div>
        </section>

        <Card className="auth-card" bordered={false}>
          <div className="auth-title">
            <h1>欢迎回来</h1>
            <p>登录后继续管理你的面试流程</p>
          </div>

          <Tabs activeKey={activeTab} onChange={(key) => setActiveTab(key as TabType)}>
            <Tabs.TabPane tab="密码登录" key="password">
              <Form
                name="password_login"
                onFinish={onPasswordFinish}
                autoComplete="off"
                size="large"
              >
                <Form.Item
                  name="email"
                  rules={[
                    { required: true, message: '请输入邮箱地址' },
                    { type: 'email', message: '请输入有效的邮箱地址' },
                  ]}
                >
                  <Input prefix={<UserOutlined />} placeholder="邮箱地址" />
                </Form.Item>

                <Form.Item
                  name="password"
                  rules={[{ required: true, message: '请输入密码' }]}
                >
                  <Input.Password prefix={<LockOutlined />} placeholder="密码" />
                </Form.Item>

                <Form.Item>
                  <Button type="link" onClick={() => navigate('/forgot-password')} className="p-0">
                    忘记密码？
                  </Button>
                </Form.Item>

                <Form.Item>
                  <Button type="primary" htmlType="submit" loading={loading} block>
                    登录
                  </Button>
                </Form.Item>

                <div className="text-center text-slate-500">
                  还没有账户？{' '}
                  <Button type="link" onClick={() => navigate('/register')} className="p-0">
                    立即注册
                  </Button>
                </div>
              </Form>
            </Tabs.TabPane>

            <Tabs.TabPane tab="验证码登录" key="code">
              <Form
                form={codeForm}
                name="code_login"
                onFinish={onCodeFinish}
                autoComplete="off"
                size="large"
              >
                <Form.Item
                  name="email"
                  rules={[
                    { required: true, message: '请输入邮箱地址' },
                    { type: 'email', message: '请输入有效的邮箱地址' },
                  ]}
                >
                  <Input prefix={<MailOutlined />} placeholder="邮箱地址" />
                </Form.Item>

                <Form.Item
                  name="code"
                  rules={[{ required: true, message: '请输入验证码' }]}
                >
                  <div className="flex gap-2">
                    <Input placeholder="验证码" className="flex-1" />
                    <Button
                      onClick={() => {
                        const email = codeForm.getFieldValue('email');
                        sendVerificationCode(email);
                      }}
                      disabled={countdown > 0 || sendingCode}
                    >
                      {countdown > 0 ? `${countdown}秒` : '发送验证码'}
                    </Button>
                  </div>
                </Form.Item>

                <Form.Item>
                  <Button type="primary" htmlType="submit" loading={loading} block>
                    登录
                  </Button>
                </Form.Item>

                <div className="text-center text-slate-500">
                  还没有账户？{' '}
                  <Button type="link" onClick={() => navigate('/register')} className="p-0">
                    立即注册
                  </Button>
                </div>
              </Form>
            </Tabs.TabPane>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}
