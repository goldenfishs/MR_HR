import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Table,
  Tag,
  Button,
  Space,
  Input,
  Select,
  Modal,
  message,
  Popconfirm,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import { interviewApi } from '../../services';
import type { Interview } from '../../types';
import dayjs from 'dayjs';

export default function AdminInterviewsPage() {
  const navigate = useNavigate();
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [filters, setFilters] = useState({
    status: '',
    search: '',
  });

  useEffect(() => {
    fetchInterviews();
  }, [filters, pagination.current, pagination.pageSize]);

  const fetchInterviews = async () => {
    setLoading(true);
    try {
      const response = await interviewApi.getAll({
        status: filters.status || undefined,
        search: filters.search || undefined,
        page: pagination.current,
        pageSize: pagination.pageSize,
      });

      if (response.data.success) {
        setInterviews(response.data.data.items);
        setPagination({
          current: response.data.data.page,
          pageSize: response.data.data.pageSize,
          total: response.data.data.total,
        });
      }
    } catch (error) {
      console.error('Failed to fetch interviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async (id: number) => {
    try {
      await interviewApi.publish(id);
      message.success('面试已发布');
      fetchInterviews();
    } catch (error: any) {
      message.error(error.response?.data?.error || '发布失败');
    }
  };

  const handleClose = async (id: number) => {
    try {
      await interviewApi.close(id);
      message.success('面试报名已关闭');
      fetchInterviews();
    } catch (error: any) {
      message.error(error.response?.data?.error || '操作失败');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await interviewApi.delete(id);
      message.success('面试已删除');
      fetchInterviews();
    } catch (error: any) {
      message.error(error.response?.data?.error || '删除失败');
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

  const columns = [
    {
      title: '面试名称',
      dataIndex: 'title',
      key: 'title',
      render: (title: string, record: Interview) => (
        <div>
          <div className="font-medium">{title}</div>
          <div className="text-xs text-gray-500">{record.position}</div>
        </div>
      ),
    },
    {
      title: '部门',
      dataIndex: 'department',
      key: 'department',
      render: (dept: string) => dept || '-',
    },
    {
      title: '面试日期',
      dataIndex: 'interview_date',
      key: 'interview_date',
      render: (date: string) => dayjs(date).format('YYYY-MM-DD'),
      sorter: (a: Interview, b: Interview) =>
        dayjs(a.interview_date).unix() - dayjs(b.interview_date).unix(),
    },
    {
      title: '时间',
      key: 'time',
      render: (_: any, record: Interview) => (
        <span>{record.start_time} - {record.end_time}</span>
      ),
    },
    {
      title: '报名情况',
      key: 'registration',
      render: (_: any, record: Interview) => (
        <span>
          {record.registered_count || 0} / {record.capacity}
        </span>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>{getStatusText(status)}</Tag>
      ),
      filters: [
        { text: '草稿', value: 'draft' },
        { text: '报名中', value: 'published' },
        { text: '已关闭', value: 'closed' },
        { text: '已结束', value: 'completed' },
      ],
    },
    {
      title: '操作',
      key: 'actions',
      render: (_: any, record: Interview) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/interviews/${record.id}`)}
          >
            查看
          </Button>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => navigate(`/admin/interviews/${record.id}/edit`)}
          >
            编辑
          </Button>
          {record.status === 'draft' && (
            <Popconfirm
              title="确认发布此面试？"
              onConfirm={() => handlePublish(record.id)}
            >
              <Button
                type="link"
                size="small"
                icon={<CheckCircleOutlined />}
              >
                发布
              </Button>
            </Popconfirm>
          )}
          {record.status === 'published' && (
            <Popconfirm
              title="确认关闭报名？"
              onConfirm={() => handleClose(record.id)}
            >
              <Button
                type="link"
                size="small"
                icon={<CloseCircleOutlined />}
              >
                关闭
              </Button>
            </Popconfirm>
          )}
          <Popconfirm
            title="确认删除此面试？"
            description="删除后将无法恢复，相关报名记录也会被删除。"
            onConfirm={() => handleDelete(record.id)}
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
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">面试管理</h1>
          <p className="text-gray-500">创建和管理面试信息</p>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => navigate('/admin/interviews/create')}
        >
          创建面试
        </Button>
      </div>

      <Card>
        <div className="mb-4 flex gap-4">
          <Input.Search
            placeholder="搜索面试名称、职位..."
            allowClear
            enterButton={<SearchOutlined />}
            onSearch={(value) => {
              setFilters({ ...filters, search: value });
              setPagination({ ...pagination, current: 1 });
            }}
            style={{ width: 300 }}
          />
          <Select
            placeholder="筛选状态"
            allowClear
            style={{ width: 150 }}
            onChange={(value) => {
              setFilters({ ...filters, status: value || '' });
              setPagination({ ...pagination, current: 1 });
            }}
          >
            <Select.Option value="draft">草稿</Select.Option>
            <Select.Option value="published">报名中</Select.Option>
            <Select.Option value="closed">已关闭</Select.Option>
            <Select.Option value="completed">已结束</Select.Option>
          </Select>
        </div>

        <Table
          columns={columns}
          dataSource={interviews}
          rowKey="id"
          loading={loading}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 个面试`,
            onChange: (page, pageSize) => {
              setPagination({ ...pagination, current: page, pageSize });
            },
          }}
        />
      </Card>
    </div>
  );
}
