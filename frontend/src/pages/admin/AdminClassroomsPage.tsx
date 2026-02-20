import { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Input,
  InputNumber,
  Modal,
  Form,
  message,
  Space,
  Switch,
  Tag,
  Select,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import { classroomApi } from '../../services';
import type { Classroom } from '../../types';

const { TextArea } = Input;

export default function AdminClassroomsPage() {
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingClassroom, setEditingClassroom] = useState<Classroom | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchClassrooms();
  }, []);

  const fetchClassrooms = async () => {
    setLoading(true);
    try {
      const response = await classroomApi.getAll();
      if (response.data.success) {
        setClassrooms(response.data.data.items);
      }
    } catch (error) {
      console.error('Failed to fetch classrooms:', error);
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingClassroom(null);
    form.resetFields();
    form.setFieldsValue({ is_available: true, equipment: [] });
    setModalOpen(true);
  };

  const openEditModal = (classroom: Classroom) => {
    setEditingClassroom(classroom);
    const equipment = classroom.equipment ? JSON.parse(classroom.equipment) : [];
    form.setFieldsValue({
      name: classroom.name,
      location: classroom.location || '',
      capacity: classroom.capacity,
      equipment: equipment,
      is_available: classroom.is_available === 1,
    });
    setModalOpen(true);
  };

  const handleSubmit = async (values: any) => {
    console.log('Form values:', values);

    // Send data in the format that matches the Joi validation schema
    const data = {
      name: values.name,
      location: values.location || null,
      capacity: values.capacity,
      equipment: values.equipment || [],
      is_available: values.is_available !== undefined ? values.is_available : undefined,
    };
    console.log('Submitting data:', data);

    try {
      let response;
      if (editingClassroom) {
        response = await classroomApi.update(editingClassroom.id, data);
        console.log('Update response:', response.data);
        if (response.data.success) {
          message.success('教室更新成功');
          setModalOpen(false);
          form.resetFields();
          fetchClassrooms();
        }
      } else {
        response = await classroomApi.create(data);
        console.log('Create response:', response.data);
        if (response.data.success) {
          message.success('教室创建成功');
          setModalOpen(false);
          form.resetFields();
          fetchClassrooms();
        }
      }
    } catch (error: any) {
      console.error('Error:', error);
      console.error('Response:', error.response?.data);
      message.error(error.response?.data?.error || '操作失败');
    }
  };

  const handleDelete = async (id: number) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除此教室吗？',
      onOk: async () => {
        try {
          await classroomApi.delete(id);
          message.success('教室已删除');
          fetchClassrooms();
        } catch (error: any) {
          message.error(error.response?.data?.error || '删除失败');
        }
      },
    });
  };

  const toggleAvailability = async (classroom: Classroom) => {
    const newValue = !classroom.is_available;  // Toggle the boolean value
    console.log('Toggling availability for classroom', classroom.id, 'from', classroom.is_available, 'to', newValue);
    try {
      const response = await classroomApi.update(classroom.id, { is_available: newValue });
      console.log('Toggle response:', response.data);
      if (response.data.success) {
        message.success('教室状态已更新');
        fetchClassrooms();
      }
    } catch (error: any) {
      console.error('Toggle error:', error);
      console.error('Response:', error.response?.data);
      message.error(error.response?.data?.error || '操作失败');
    }
  };

  const columns = [
    {
      title: '教室名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '位置',
      dataIndex: 'location',
      key: 'location',
      render: (location: string) => location || '-',
    },
    {
      title: '容量',
      dataIndex: 'capacity',
      key: 'capacity',
      render: (capacity: number) => `${capacity} 人`,
    },
    {
      title: '设备',
      dataIndex: 'equipment',
      key: 'equipment',
      render: (equipment: string) => {
        if (!equipment) return '-';
        const items = JSON.parse(equipment);
        return (
          <Space wrap>
            {items.map((item: string, index: number) => (
              <Tag key={index}>{item}</Tag>
            ))}
          </Space>
        );
      },
    },
    {
      title: '状态',
      dataIndex: 'is_available',
      key: 'is_available',
      render: (isAvailable: number, record: Classroom) => (
        <Switch
          checked={isAvailable === 1}
          onChange={() => toggleAvailability(record)}
          checkedChildren="可用"
          unCheckedChildren="不可用"
        />
      ),
    },
    {
      title: '操作',
      key: 'actions',
      render: (_: any, record: Classroom) => (
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
          <h1 className="text-2xl font-bold text-gray-800 mb-2">教室管理</h1>
          <p className="text-gray-500">管理面试教室和场地</p>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={openCreateModal}
        >
          添加教室
        </Button>
      </div>

      <Card>
        <Table
          columns={columns}
          dataSource={classrooms}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 个教室`,
          }}
        />
      </Card>

      <Modal
        title={editingClassroom ? '编辑教室' : '添加教室'}
        open={modalOpen}
        onCancel={() => {
          setModalOpen(false);
          setEditingClassroom(null);
          form.resetFields();
        }}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            label="教室名称"
            name="name"
            rules={[{ required: true, message: '请输入教室名称' }]}
          >
            <Input placeholder="如：101室" />
          </Form.Item>

          <Form.Item
            label="位置"
            name="location"
          >
            <Input placeholder="如：A栋1楼" />
          </Form.Item>

          <Form.Item
            label="容量"
            name="capacity"
            rules={[{ required: true, message: '请输入容量' }]}
          >
            <InputNumber min={1} style={{ width: '100%' }} placeholder="人数" />
          </Form.Item>

          <Form.Item
            label="设备"
            name="equipment"
          >
            <Select
              mode="tags"
              placeholder="选择或输入设备"
              options={[
                { label: '投影仪', value: '投影仪' },
                { label: '白板', value: '白板' },
                { label: '电脑', value: '电脑' },
                { label: '音响', value: '音响' },
                { label: '网络', value: '网络' },
                { label: '空调', value: '空调' },
              ]}
            />
          </Form.Item>

          <Form.Item
            label="状态"
            name="is_available"
            valuePropName="checked"
          >
            <Switch checkedChildren="可用" unCheckedChildren="不可用" />
          </Form.Item>

          <Form.Item className="mb-0">
            <Button type="primary" htmlType="submit" block>
              {editingClassroom ? '更新' : '创建'}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
