import { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Tag,
  Select,
  Empty,
  Pagination,
  Button,
  Typography,
  Space,
} from 'antd';
import {
  FileTextOutlined,
  VideoCameraOutlined,
  BookOutlined,
  LinkOutlined,
} from '@ant-design/icons';
import { resourceApi } from '../../services';
import type { LearningResource } from '../../types';

const { Option } = Select;
const { Text, Paragraph } = Typography;

export default function ResourcesPage() {
  const [resources, setResources] = useState<LearningResource[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 12,
    total: 0,
  });
  const [filters, setFilters] = useState({
    category: '',
    type: '',
  });

  useEffect(() => {
    fetchResources();
    fetchCategories();
  }, [filters, pagination.current, pagination.pageSize]);

  const fetchResources = async () => {
    setLoading(true);
    try {
      const response = await resourceApi.getAll({
        category: filters.category || undefined,
        type: filters.type || undefined,
        page: pagination.current,
        pageSize: pagination.pageSize,
      });

      if (response.data.success) {
        setResources(response.data.data.items);
        setPagination({
          current: response.data.data.page,
          pageSize: response.data.data.pageSize,
          total: response.data.data.total,
        });
      }
    } catch (error) {
      console.error('Failed to fetch resources:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await resourceApi.getCategories();
      if (response.data.success) {
        setCategories(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const handlePageChange = (page: number, pageSize: number) => {
    setPagination({ ...pagination, current: page, pageSize });
  };

  const getTypeIcon = (type: string) => {
    const icons: Record<string, React.ReactNode> = {
      article: <FileTextOutlined />,
      video: <VideoCameraOutlined />,
      document: <BookOutlined />,
    };
    return icons[type] || <FileTextOutlined />;
  };

  const getTypeText = (type: string) => {
    const texts: Record<string, string> = {
      article: '文章',
      video: '视频',
      document: '文档',
    };
    return texts[type] || type;
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      article: 'blue',
      video: 'green',
      document: 'orange',
    };
    return colors[type] || 'default';
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">学习资源</h1>
        <p className="text-gray-500">查看学习资料，提升面试技巧</p>
      </div>

      <Card className="mb-6">
        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
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
          <Col xs={24} md={12}>
            <Select
              placeholder="选择类型"
              allowClear
              style={{ width: '100%' }}
              onChange={(value) => {
                setFilters({ ...filters, type: value || '' });
                setPagination({ ...pagination, current: 1 });
              }}
            >
              <Option value="article">文章</Option>
              <Option value="video">视频</Option>
              <Option value="document">文档</Option>
            </Select>
          </Col>
        </Row>
      </Card>

      {loading ? (
        <div className="text-center py-12">
          <span className="text-gray-400">加载中...</span>
        </div>
      ) : resources.length === 0 ? (
        <Empty description="没有找到相关资源" />
      ) : (
        <>
          <Row gutter={[16, 16]}>
            {resources.map((resource) => (
              <Col xs={24} sm={12} lg={8} key={resource.id}>
                <Card
                  hoverable
                  className="h-full card-hover"
                  cover={
                    <div className="h-32 bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                      <span className="text-4xl text-white">
                        {getTypeIcon(resource.type)}
                      </span>
                    </div>
                  }
                >
                  <div className="mb-2">
                    <Space>
                      <Tag color={getTypeColor(resource.type)} icon={getTypeIcon(resource.type)}>
                        {getTypeText(resource.type)}
                      </Tag>
                      {resource.category && <Tag>{resource.category}</Tag>}
                    </Space>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2 line-clamp-2">
                    {resource.title}
                  </h3>
                  {resource.description && (
                    <Paragraph
                      ellipsis={{ rows: 2 }}
                      className="text-gray-600 mb-4"
                    >
                      {resource.description}
                    </Paragraph>
                  )}
                  {resource.url && (
                    <Button
                      type="primary"
                      icon={<LinkOutlined />}
                      href={resource.url}
                      target="_blank"
                      block
                    >
                      查看资源
                    </Button>
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
              showTotal={(total) => `共 ${total} 个资源`}
            />
          </div>
        </>
      )}
    </div>
  );
}
