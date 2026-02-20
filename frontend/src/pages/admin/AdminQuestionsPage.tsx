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
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { questionApi } from '../../services';
import type { QuestionBank } from '../../types';

const { TextArea } = Input;
const { Option } = Select;

export default function AdminQuestionsPage() {
  const [questions, setQuestions] = useState<QuestionBank[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<QuestionBank | null>(null);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [filters, setFilters] = useState({
    category: '',
    difficulty: '',
    search: '',
  });
  const [form] = Form.useForm();

  useEffect(() => {
    fetchQuestions();
    fetchCategories();
  }, [filters, pagination.current, pagination.pageSize]);

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const response = await questionApi.getAll({
        category: filters.category || undefined,
        difficulty: filters.difficulty || undefined,
        search: filters.search || undefined,
        page: pagination.current,
        pageSize: pagination.pageSize,
      });

      if (response.data.success) {
        setQuestions(response.data.data.items);
        setPagination({
          current: response.data.data.page,
          pageSize: response.data.data.pageSize,
          total: response.data.data.total,
        });
      }
    } catch (error) {
      console.error('Failed to fetch questions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await questionApi.getCategories();
      if (response.data.success) {
        setCategories(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const openCreateModal = () => {
    setEditingQuestion(null);
    form.resetFields();
    setModalOpen(true);
  };

  const openEditModal = (question: QuestionBank) => {
    setEditingQuestion(question);
    form.setFieldsValue({
      ...question,
      tags: question.tags ? JSON.parse(question.tags) : [],
    });
    setModalOpen(true);
  };

  const handleSubmit = async (values: any) => {
    const data = {
      ...values,
      tags: values.tags ? JSON.stringify(values.tags) : undefined,
    };

    try {
      if (editingQuestion) {
        await questionApi.update(editingQuestion.id, data);
        message.success('题目更新成功');
      } else {
        await questionApi.create(data);
        message.success('题目创建成功');
      }
      setModalOpen(false);
      form.resetFields();
      fetchQuestions();
    } catch (error: any) {
      message.error(error.response?.data?.error || '操作失败');
    }
  };

  const handleDelete = async (id: number) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除此题目吗？',
      onOk: async () => {
        try {
          await questionApi.delete(id);
          message.success('题目已删除');
          fetchQuestions();
        } catch (error: any) {
          message.error(error.response?.data?.error || '删除失败');
        }
      },
    });
  };

  const getDifficultyColor = (difficulty?: string) => {
    const colors: Record<string, string> = {
      easy: 'green',
      medium: 'orange',
      hard: 'red',
    };
    return colors[difficulty || ''] || 'default';
  };

  const getDifficultyText = (difficulty?: string) => {
    const texts: Record<string, string> = {
      easy: '简单',
      medium: '中等',
      hard: '困难',
    };
    return texts[difficulty || ''] || difficulty;
  };

  const columns = [
    {
      title: '题目',
      dataIndex: 'question',
      key: 'question',
      render: (question: string) => (
        <div className="max-w-md line-clamp-2">{question}</div>
      ),
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      render: (category: string) => <Tag color="blue">{category}</Tag>,
    },
    {
      title: '难度',
      dataIndex: 'difficulty',
      key: 'difficulty',
      render: (difficulty: string) => (
        <Tag color={getDifficultyColor(difficulty)}>
          {getDifficultyText(difficulty)}
        </Tag>
      ),
    },
    {
      title: '答案',
      dataIndex: 'answer',
      key: 'answer',
      render: (answer: string) => (
        <div className="max-w-md line-clamp-2 text-gray-500">{answer || '-'}</div>
      ),
    },
    {
      title: '操作',
      key: 'actions',
      render: (_: any, record: QuestionBank) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => openEditModal(record)}
          >
            编辑
          </Button>
          <Button
            type="link"
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">题库管理</h1>
          <p className="text-gray-500">管理面试题目</p>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={openCreateModal}
        >
          添加题目
        </Button>
      </div>

      <Card>
        <div className="mb-4 flex gap-4">
          <Input.Search
            placeholder="搜索题目..."
            allowClear
            enterButton={<SearchOutlined />}
            onSearch={(value) => {
              setFilters({ ...filters, search: value });
              setPagination({ ...pagination, current: 1 });
            }}
            style={{ width: 300 }}
          />
          <Select
            placeholder="筛选分类"
            allowClear
            style={{ width: 150 }}
            onChange={(value) => {
              setFilters({ ...filters, category: value || '' });
              setPagination({ ...pagination, current: 1 });
            }}
          >
            {categories.map((cat) => (
              <Option key={cat} value={cat}>{cat}</Option>
            ))}
          </Select>
          <Select
            placeholder="筛选难度"
            allowClear
            style={{ width: 120 }}
            onChange={(value) => {
              setFilters({ ...filters, difficulty: value || '' });
              setPagination({ ...pagination, current: 1 });
            }}
          >
            <Option value="easy">简单</Option>
            <Option value="medium">中等</Option>
            <Option value="hard">困难</Option>
          </Select>
        </div>

        <Table
          columns={columns}
          dataSource={questions}
          rowKey="id"
          loading={loading}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 道题`,
            onChange: (page, pageSize) => {
              setPagination({ ...pagination, current: page, pageSize });
            },
          }}
        />
      </Card>

      <Modal
        title={editingQuestion ? '编辑题目' : '添加题目'}
        open={modalOpen}
        onCancel={() => {
          setModalOpen(false);
          setEditingQuestion(null);
          form.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{ difficulty: 'medium' }}
        >
          <Form.Item
            label="分类"
            name="category"
            rules={[{ required: true, message: '请输入分类' }]}
          >
            <Select
              showSearch
              placeholder="选择或输入分类"
              options={categories.map((c) => ({ label: c, value: c }))}
              notFoundContent={null}
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
              allowClear
              mode="tags"
              maxTagCount={1}
            />
          </Form.Item>

          <Form.Item
            label="题目"
            name="question"
            rules={[{ required: true, message: '请输入题目' }]}
          >
            <TextArea rows={3} placeholder="请输入题目" />
          </Form.Item>

          <Form.Item
            label="答案"
            name="answer"
          >
            <TextArea rows={4} placeholder="请输入参考答案（可选）" />
          </Form.Item>

          <Form.Item
            label="难度"
            name="difficulty"
          >
            <Select>
              <Option value="easy">简单</Option>
              <Option value="medium">中等</Option>
              <Option value="hard">困难</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="标签"
            name="tags"
          >
            <Select
              mode="tags"
              placeholder="输入标签（可选）"
            />
          </Form.Item>

          <Form.Item className="mb-0">
            <Button type="primary" htmlType="submit" block>
              {editingQuestion ? '更新' : '创建'}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
