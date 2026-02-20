import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Table,
  Tag,
  Button,
  Select,
  DatePicker,
  Space,
  Modal,
  Form,
  Input,
  message,
} from 'antd';
import {
  EyeOutlined,
  CalendarOutlined,
} from '@ant-design/icons';
import { interviewApi, registrationApi } from '../../services';
import type { InterviewSlot, Interview } from '../../types';
import dayjs from 'dayjs';
import { useAuthStore } from '../../store/authStore';

const { RangePicker } = DatePicker;

export default function InterviewerSlotsPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [slots, setSlots] = useState<InterviewSlot[]>([]);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<[any, any] | null>(null);

  useEffect(() => {
    fetchInterviews();
  }, []);

  const fetchInterviews = async () => {
    try {
      const response = await interviewApi.getAll({ status: 'published', pageSize: 100 });
      if (response.data.success) {
        setInterviews(response.data.data.items);

        // Fetch slots for all interviews
        const allSlots: InterviewSlot[] = [];
        for (const interview of response.data.data.items) {
          try {
            const slotsRes = await interviewApi.getSlots(interview.id);
            if (slotsRes.data.success) {
              allSlots.push(...slotsRes.data.data);
            }
          } catch (e) {
            // Ignore errors
          }
        }

        const assignedSlots = allSlots.filter((slot) => {
          if (!slot.interviewer_ids || !user?.id) {
            return false;
          }

          try {
            const interviewerIds = JSON.parse(slot.interviewer_ids) as number[];
            return Array.isArray(interviewerIds) && interviewerIds.includes(user.id);
          } catch {
            return false;
          }
        });

        setSlots(assignedSlots);
      }
    } catch (error) {
      console.error('Failed to fetch interviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const getInterviewTitle = (interviewId: number) => {
    const interview = interviews.find((i) => i.id === interviewId);
    return interview?.title || 'Unknown';
  };

  const columns = [
    {
      title: '面试',
      dataIndex: 'interview_id',
      key: 'interview',
      render: (interviewId: number) => getInterviewTitle(interviewId),
    },
    {
      title: '日期',
      dataIndex: 'date',
      key: 'date',
      render: (date: string) => dayjs(date).format('YYYY-MM-DD'),
      sorter: (a: InterviewSlot, b: InterviewSlot) =>
        dayjs(a.date).unix() - dayjs(b.date).unix(),
    },
    {
      title: '时间',
      key: 'time',
      render: (_: any, record: InterviewSlot) => (
        <span>{record.start_time} - {record.end_time}</span>
      ),
    },
    {
      title: '教室',
      dataIndex: ['classroom', 'name'],
      key: 'classroom',
      render: (name: string, record: InterviewSlot) => (
        <div>
          {name && <div className="font-medium">{name}</div>}
          {record.classroom?.location && (
            <div className="text-xs text-gray-500">{record.classroom.location}</div>
          )}
        </div>
      ),
    },
    {
      title: '预约情况',
      key: 'booking',
      render: (_: any, record: InterviewSlot) => {
        const percentage = Math.round((record.booked_count / record.capacity) * 100);
        return (
          <div>
            <div>{record.booked_count} / {record.capacity}</div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
              <div
                className="bg-blue-500 h-2 rounded-full"
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        );
      },
    },
    {
      title: '操作',
      key: 'actions',
      render: (_: any, record: InterviewSlot) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => viewSlotRegistrations(record)}
          >
            查看候选人
          </Button>
        </Space>
      ),
    },
  ];

  const viewSlotRegistrations = (slot: InterviewSlot) => {
    Modal.info({
      title: `场次候选人 - ${dayjs(slot.date).format('MM月DD日')} ${slot.start_time}`,
      width: 700,
      content: (
        <SlotRegistrations slotId={slot.id} />
      ),
    });
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">我的面试场次</h1>
        <p className="text-gray-500">查看和管理您参与的面试场次</p>
      </div>

      <Card>
        <div className="mb-4 flex justify-between items-center">
          <RangePicker
            onChange={(dates) => setDateRange(dates as [any, any])}
          />
          <Select
            placeholder="筛选面试"
            allowClear
            style={{ width: 300 }}
            showSearch
            optionFilterProp="children"
            onChange={() => {}}
          >
            {interviews.map((interview) => (
              <Select.Option key={interview.id} value={interview.id}>
                {interview.title}
              </Select.Option>
            ))}
          </Select>
        </div>

        <Table
          columns={columns}
          dataSource={slots}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 个场次`,
          }}
        />
      </Card>
    </div>
  );
}

function SlotRegistrations({ slotId }: { slotId: number }) {
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRegistrations = async () => {
      try {
        const response = await registrationApi.getAll();
        if (response.data.success) {
          const slotRegs = response.data.data.items.filter(
            (r: any) => r.slot_id === slotId
          );
          setRegistrations(slotRegs);
        }
      } catch (error) {
        console.error('Failed to fetch registrations:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRegistrations();
  }, [slotId]);

  if (loading) {
    return <div className="text-center py-4">加载中...</div>;
  }

  if (registrations.length === 0) {
    return <div className="text-center py-4 text-gray-500">暂无候选人报名此场次</div>;
  }

  return (
    <div className="space-y-3">
      {registrations.map((reg) => (
        <Card key={reg.id} size="small">
          <div className="flex justify-between items-start">
            <div>
              <div className="font-medium">{reg.user?.name}</div>
              <div className="text-sm text-gray-500">{reg.user?.email}</div>
              {reg.user?.student_id && (
                <div className="text-xs text-gray-400">学号：{reg.user.student_id}</div>
              )}
              {reg.user?.major && (
                <div className="text-xs text-gray-400">专业：{reg.user.major}</div>
              )}
            </div>
            <Tag color={reg.status === 'confirmed' ? 'success' : 'processing'}>
              {reg.status === 'confirmed' ? '已确认' : '待确认'}
            </Tag>
          </div>
        </Card>
      ))}
    </div>
  );
}
