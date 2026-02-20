import { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Tag,
  Button,
  Input,
  Select,
  Modal,
  Form,
  message,
  Space,
  Popconfirm,
} from 'antd';
import {
  UserOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { adminApi } from '../../services';
import { useAuthStore } from '../../store/authStore';
import type { User } from '../../types';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [filters, setFilters] = useState({
    role: '',
    search: '',
  });
  const [roleForm] = Form.useForm();
  const { user: currentUser } = useAuthStore();

  useEffect(() => {
    fetchUsers();
  }, [filters, pagination.current, pagination.pageSize]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await adminApi.getAllUsers({
        role: filters.role || undefined,
        page: pagination.current,
        pageSize: pagination.pageSize,
      });

      if (response.data.success) {
        setUsers(response.data.data.items);
        setPagination({
          current: response.data.data.page,
          pageSize: response.data.data.pageSize,
          total: response.data.data.total,
        });
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const openRoleModal = (user: User) => {
    setSelectedUser(user);
    roleForm.setFieldsValue({ role: user.role });
    setRoleModalOpen(true);
  };

  const handleRoleChange = async (values: { role: string }) => {
    if (!selectedUser) return;

    try {
      await adminApi.updateUserRole(selectedUser.id, values.role);
      message.success('用户角色已更新');
      setRoleModalOpen(false);
      fetchUsers();
    } catch (error: any) {
      message.error(error.response?.data?.error || '操作失败');
    }
  };

  const handleDelete = async (id: number) => {
    if (id === currentUser?.id) {
      message.warning('不能删除自己的账户');
      return;
    }

    try {
      await adminApi.deleteUser(id);
      message.success('用户已删除');
      fetchUsers();
    } catch (error: any) {
      message.error(error.response?.data?.error || '删除失败');
    }
  };

  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      user: 'blue',
      admin: 'red',
      interviewer: 'green',
    };
    return colors[role] || 'default';
  };

  const getRoleText = (role: string) => {
    const texts: Record<string, string> = {
      user: '普通用户',
      admin: '管理员',
      interviewer: '面试官',
    };
    return texts[role] || role;
  };

  const columns = [
    {
      title: '用户',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: User) => (
        <div>
          <div className="font-medium">{name}</div>
          <div className="text-xs text-gray-500">{record.email}</div>
        </div>
      ),
    },
    {
      title: '学号',
      dataIndex: 'student_id',
      key: 'student_id',
      render: (id: string) => id || '-',
    },
    {
      title: '专业',
      dataIndex: 'major',
      key: 'major',
      render: (major: string) => major || '-',
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => (
        <Tag color={getRoleColor(role)}>{getRoleText(role)}</Tag>
      ),
      filters: [
        { text: '普通用户', value: 'user' },
        { text: '面试官', value: 'interviewer' },
        { text: '管理员', value: 'admin' },
      ],
    },
    {
      title: '邮箱验证',
      dataIndex: 'is_verified',
      key: 'is_verified',
      render: (verified: number) => (
        <Tag color={verified ? 'success' : 'warning'}>
          {verified ? '已验证' : '未验证'}
        </Tag>
      ),
    },
    {
      title: '注册时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => new Date(date).toLocaleString('zh-CN'),
    },
    {
      title: '操作',
      key: 'actions',
      render: (_: any, record: User) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => openRoleModal(record)}
          >
            修改角色
          </Button>
          {record.id !== currentUser?.id && (
            <Popconfirm
              title="确认删除用户"
              description="删除后用户将无法登录，相关数据可能会被保留。"
              onConfirm={() => handleDelete(record.id)}
              okText="确认"
              cancelText="取消"
            >
              <Button
                type="link"
                size="small"
                danger
                icon={<DeleteOutlined />}
              >
                删除
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">用户管理</h1>
        <p className="text-gray-500">管理系统用户和权限</p>
      </div>

      <Card>
        <div className="mb-4 flex gap-4">
          <Input.Search
            placeholder="搜索用户名、邮箱..."
            allowClear
            enterButton={<SearchOutlined />}
            onSearch={(value) => {
              setFilters({ ...filters, search: value });
              setPagination({ ...pagination, current: 1 });
            }}
            style={{ width: 300 }}
          />
          <Select
            placeholder="筛选角色"
            allowClear
            style={{ width: 150 }}
            onChange={(value) => {
              setFilters({ ...filters, role: value || '' });
              setPagination({ ...pagination, current: 1 });
            }}
          >
            <Select.Option value="user">普通用户</Select.Option>
            <Select.Option value="interviewer">面试官</Select.Option>
            <Select.Option value="admin">管理员</Select.Option>
          </Select>
        </div>

        <Table
          columns={columns}
          dataSource={users}
          rowKey="id"
          loading={loading}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 个用户`,
            onChange: (page, pageSize) => {
              setPagination({ ...pagination, current: page, pageSize });
            },
          }}
        />
      </Card>

      <Modal
        title="修改用户角色"
        open={roleModalOpen}
        onCancel={() => {
          setRoleModalOpen(false);
          setSelectedUser(null);
          roleForm.resetFields();
        }}
        footer={null}
      >
        {selectedUser && (
          <div className="mb-4 p-3 bg-gray-50 rounded">
            <p><strong>用户：</strong>{selectedUser.name}</p>
            <p><strong>邮箱：</strong>{selectedUser.email}</p>
          </div>
        )}

        <Form
          form={roleForm}
          layout="vertical"
          onFinish={handleRoleChange}
        >
          <Form.Item
            label="角色"
            name="role"
            rules={[{ required: true, message: '请选择角色' }]}
          >
            <Select>
              <Select.Option value="user">普通用户</Select.Option>
              <Select.Option value="interviewer">面试官</Select.Option>
              <Select.Option value="admin">管理员</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item className="mb-0">
            <Button type="primary" htmlType="submit" block>
              确认修改
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
