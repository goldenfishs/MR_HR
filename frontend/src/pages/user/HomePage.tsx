import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Row, Col, Tag, Badge, Input, Select, Empty, Pagination, Space, Statistic } from 'antd';
import { SearchOutlined, CalendarOutlined, TeamOutlined, EnvironmentOutlined } from '@ant-design/icons';
import { interviewApi } from '../../services';
import type { Interview } from '../../types';
import dayjs from 'dayjs';

const { Search } = Input;
const { Option } = Select;

export default function HomePage() {
  const navigate = useNavigate();
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [filters, setFilters] = useState({
    status: 'published',
    search: '',
  });

  const fetchInterviews = async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const response = await interviewApi.getAll({
        status: filters.status === 'all' ? undefined : filters.status,
        search: filters.search || undefined,
        page,
        pageSize,
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

  useEffect(() => {
    fetchInterviews(1, pagination.pageSize);
  }, [filters]);

  const handlePageChange = (page: number, pageSize: number) => {
    fetchInterviews(page, pageSize);
  };

  const handleSearch = (value: string) => {
    setFilters({ ...filters, search: value });
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

  return (
    <div className="fade-in-content">
      <div className="hero-banner">
        <h1>面试机会总览</h1>
        <p>聚合你当前可报名与历史面试项目，快速查看进度并进入详情。</p>
      </div>

      <Row gutter={[16, 16]} className="mb-4">
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic title="当前筛选结果" value={pagination.total} suffix="项" />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic title="本页展示" value={interviews.length} suffix="项" />
          </Card>
        </Col>
        <Col xs={24} sm={24} lg={8}>
          <Card>
            <Statistic title="最新刷新" value={dayjs().format('HH:mm:ss')} />
          </Card>
        </Col>
      </Row>

      <Card className="filter-shell mb-6">
        <Row gutter={[12, 12]} align="middle">
          <Col xs={24} md={8} lg={6}>
            <Select
              value={filters.status}
              style={{ width: '100%' }}
              onChange={(value) => setFilters({ ...filters, status: value })}
            >
              <Option value="published">报名中</Option>
              <Option value="all">全部状态</Option>
              <Option value="closed">已关闭</Option>
              <Option value="completed">已结束</Option>
            </Select>
          </Col>
          <Col xs={24} md={16} lg={18}>
            <Search
              placeholder="搜索面试标题、描述、职位..."
              allowClear
              enterButton={<SearchOutlined />}
              size="large"
              onSearch={handleSearch}
            />
          </Col>
        </Row>
      </Card>

      {loading ? (
        <div className="text-center py-12">
          <span className="text-slate-400">加载中...</span>
        </div>
      ) : interviews.length === 0 ? (
        <Empty description="暂无面试信息" />
      ) : (
        <>
          <Row gutter={[16, 16]}>
            {interviews.map((interview) => (
              <Col xs={24} md={12} lg={8} key={interview.id}>
                <Badge.Ribbon
                  text={getStatusText(interview.status)}
                  color={getStatusColor(interview.status)}
                >
                  <Card
                    hoverable
                    className="h-full card-hover"
                    onClick={() => navigate(`/interviews/${interview.id}`)}
                  >
                    <div className="mb-3">
                      <h3 className="text-lg font-semibold text-slate-800 line-clamp-2">
                        {interview.title}
                      </h3>
                      <p className="text-teal-700 font-medium mt-1">{interview.position}</p>
                    </div>

                    {interview.description && (
                      <p className="text-slate-600 text-sm mb-3 line-clamp-2">
                        {interview.description}
                      </p>
                    )}

                    <Space direction="vertical" size="small" className="w-full">
                      <div className="flex items-center text-slate-500 text-sm">
                        <CalendarOutlined className="mr-2" />
                        {dayjs(interview.interview_date).format('YYYY年MM月DD日')}
                      </div>
                      <div className="flex items-center text-slate-500 text-sm">
                        <EnvironmentOutlined className="mr-2" />
                        {interview.location || '待定'}
                      </div>
                      <div className="flex items-center text-slate-500 text-sm">
                        <TeamOutlined className="mr-2" />
                        已报名：{interview.registered_count || 0} / {interview.capacity}
                      </div>
                    </Space>

                    {interview.department && (
                      <div className="mt-3">
                        <Tag color="cyan">{interview.department}</Tag>
                      </div>
                    )}
                  </Card>
                </Badge.Ribbon>
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
              showTotal={(total) => `共 ${total} 个面试`}
            />
          </div>
        </>
      )}
    </div>
  );
}
