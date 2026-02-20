import { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Tag,
  Input,
  Select,
  Button,
  Empty,
  Pagination,
  Space,
  Modal,
  message,
} from 'antd';
import { SearchOutlined, BulbOutlined } from '@ant-design/icons';
import { questionApi } from '../../services';
import type { QuestionBank } from '../../types';

const { Search } = Input;
const { Option } = Select;

export default function QuestionsPage() {
  const [questions, setQuestions] = useState<QuestionBank[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
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
  const [showAnswer, setShowAnswer] = useState<Record<number, boolean>>({});
  const [randomQuestions, setRandomQuestions] = useState<QuestionBank[]>([]);
  const [randomModalOpen, setRandomModalOpen] = useState(false);

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

  const handleSearch = (value: string) => {
    setFilters({ ...filters, search: value });
    setPagination({ ...pagination, current: 1 });
  };

  const handlePageChange = (page: number, pageSize: number) => {
    setPagination({ ...pagination, current: page, pageSize });
  };

  const toggleAnswer = (id: number) => {
    setShowAnswer((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const getRandomQuestions = async () => {
    try {
      const response = await questionApi.getRandom(5, filters.category || undefined);
      if (response.data.success) {
        setRandomQuestions(response.data.data);
        setRandomModalOpen(true);
      }
    } catch (error) {
      message.error('获取随机题目失败');
    }
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

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">面试题库</h1>
          <p className="text-gray-500">浏览面试题目，准备面试</p>
        </div>
        <Button
          type="primary"
          icon={<BulbOutlined />}
          onClick={getRandomQuestions}
        >
          随机练习
        </Button>
      </div>

      <Card className="mb-6">
        <Row gutter={[16, 16]}>
          <Col xs={24} md={8}>
            <Select
              placeholder="选择分类"
              allowClear
              style={{ width: '100%' }}
              onChange={(value) => {
                setFilters({ ...filters, category: value || '' });
                setPagination({ ...pagination, current: 1 });
              }}
            >
              {categories.map((cat) => (
                <Option key={cat} value={cat}>
                  {cat}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} md={8}>
            <Select
              placeholder="选择难度"
              allowClear
              style={{ width: '100%' }}
              onChange={(value) => {
                setFilters({ ...filters, difficulty: value || '' });
                setPagination({ ...pagination, current: 1 });
              }}
            >
              <Option value="easy">简单</Option>
              <Option value="medium">中等</Option>
              <Option value="hard">困难</Option>
            </Select>
          </Col>
          <Col xs={24} md={8}>
            <Search
              placeholder="搜索题目..."
              allowClear
              enterButton={<SearchOutlined />}
              onSearch={handleSearch}
            />
          </Col>
        </Row>
      </Card>

      {loading ? (
        <div className="text-center py-12">
          <span className="text-gray-400">加载中...</span>
        </div>
      ) : questions.length === 0 ? (
        <Empty description="没有找到相关题目" />
      ) : (
        <>
          <Row gutter={[16, 16]}>
            {questions.map((question) => (
              <Col xs={24} md={12} key={question.id}>
                <Card className="h-full">
                  <div className="mb-3">
                    <Space size="small">
                      <Tag color="blue">{question.category}</Tag>
                      {question.difficulty && (
                        <Tag color={getDifficultyColor(question.difficulty)}>
                          {getDifficultyText(question.difficulty)}
                        </Tag>
                      )}
                    </Space>
                  </div>
                  <p className="text-gray-800 mb-4">{question.question}</p>
                  <div className="flex justify-between items-center">
                    <Button
                      type="link"
                      onClick={() => toggleAnswer(question.id)}
                    >
                      {showAnswer[question.id] ? '隐藏答案' : '查看答案'}
                    </Button>
                  </div>
                  {showAnswer[question.id] && question.answer && (
                    <div className="mt-3 p-3 bg-gray-50 rounded">
                      <p className="text-gray-700 whitespace-pre-line">{question.answer}</p>
                    </div>
                  )}
                </Card>
              </Col>
            ))}
          </Row>

          <div className="mt-6 flex justify-center">
            <Pagination
              current={pagination.current}
              pageSize={pagination.pageSize}
              total={pagination.total}
              onChange={handlePageChange}
              showSizeChanger
              showTotal={(total) => `共 ${total} 道题`}
            />
          </div>
        </>
      )}

      <Modal
        title="随机练习题"
        open={randomModalOpen}
        onCancel={() => setRandomModalOpen(false)}
        footer={[
          <Button key="close" onClick={() => setRandomModalOpen(false)}>
            关闭
          </Button>,
          <Button key="refresh" type="primary" onClick={getRandomQuestions}>
            换一批
          </Button>,
        ]}
        width={700}
      >
        <Space direction="vertical" size="middle" className="w-full">
          {randomQuestions.map((q, index) => (
            <Card key={q.id} size="small">
              <div className="flex gap-2 mb-2">
                <Tag color="blue">{q.category}</Tag>
                {q.difficulty && (
                  <Tag color={getDifficultyColor(q.difficulty)}>
                    {getDifficultyText(q.difficulty)}
                  </Tag>
                )}
                <span className="text-gray-400">#{index + 1}</span>
              </div>
              <p className="text-gray-800 mb-2">{q.question}</p>
              <Button
                type="link"
                size="small"
                onClick={() => toggleAnswer(q.id)}
              >
                {showAnswer[q.id] ? '隐藏答案' : '查看答案'}
              </Button>
              {showAnswer[q.id] && q.answer && (
                <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                  <p className="text-gray-700 whitespace-pre-line">{q.answer}</p>
                </div>
              )}
            </Card>
          ))}
        </Space>
      </Modal>
    </div>
  );
}
