import { Request, Response } from 'express';
import InterviewModel from '../models/Interview.model';
import RegistrationModel from '../models/Registration.model';
import UserModel from '../models/User.model';
import InterviewSlotModel from '../models/InterviewSlot.model';

class AdminController {
  async getDashboard(req: Request, res: Response): Promise<void> {
    try {
      // Get statistics
      const totalUsers = await UserModel.count();
      const totalInterviews = await InterviewModel.count();
      const publishedInterviews = await InterviewModel.count({ status: 'published' });
      const totalRegistrations = await RegistrationModel.count();

      // Get recent registrations
      const recentRegistrations = await RegistrationModel.findAll({ limit: 10, offset: 0 });

      // Get upcoming interviews
      const upcomingInterviews = await InterviewModel.findAll({
        status: 'published',
        limit: 5,
        offset: 0,
      });

      res.status(200).json({
        success: true,
        data: {
          stats: {
            totalUsers,
            totalInterviews,
            publishedInterviews,
            totalRegistrations,
          },
          recentRegistrations,
          upcomingInterviews,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch dashboard data',
      });
    }
  }

  async getStatistics(req: Request, res: Response): Promise<void> {
    try {
      // User statistics
      const userStats = {
        total: await UserModel.count(),
        users: await UserModel.count('user'),
        interviewers: await UserModel.count('interviewer'),
        admins: await UserModel.count('admin'),
      };

      // Interview statistics
      const interviewStats = {
        total: await InterviewModel.count(),
        draft: await InterviewModel.count({ status: 'draft' }),
        published: await InterviewModel.count({ status: 'published' }),
        closed: await InterviewModel.count({ status: 'closed' }),
        completed: await InterviewModel.count({ status: 'completed' }),
      };

      // Registration statistics
      const registrationStats = {
        total: await RegistrationModel.count(),
        pending: await RegistrationModel.count({ status: 'pending' }),
        confirmed: await RegistrationModel.count({ status: 'confirmed' }),
        cancelled: await RegistrationModel.count({ status: 'cancelled' }),
        completed: await RegistrationModel.count({ status: 'completed' }),
      };

      // Get registrations by interview
      const registrationsByInterview: any[] = [];
      const interviews = await InterviewModel.findAll();
      for (const interview of interviews) {
        const count = await RegistrationModel.count({ interviewId: interview.id });
        registrationsByInterview.push({
          interviewId: interview.id,
          interviewTitle: interview.title,
          count,
        });
      }

      res.status(200).json({
        success: true,
        data: {
          userStats,
          interviewStats,
          registrationStats,
          registrationsByInterview,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch statistics',
      });
    }
  }

  async getAllUsers(req: Request, res: Response): Promise<void> {
    try {
      const {
        role,
        page = '1',
        pageSize = '10',
      } = req.query;

      const pageNum = parseInt(page as string);
      const pageSizeNum = parseInt(pageSize as string);
      const offset = (pageNum - 1) * pageSizeNum;

      const users = await UserModel.findAll({
        role: role as any,
        limit: pageSizeNum,
        offset,
      });

      const total = await UserModel.count(role as any);

      res.status(200).json({
        success: true,
        data: {
          items: users,
          total,
          page: pageNum,
          pageSize: pageSizeNum,
          totalPages: Math.ceil(total / pageSizeNum),
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch users',
      });
    }
  }

  async updateUserRole(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { role } = req.body;

      if (!['user', 'admin', 'interviewer'].includes(role)) {
        res.status(400).json({
          success: false,
          error: 'Invalid role',
        });
        return;
      }

      const updated = await UserModel.update(parseInt(id), { role });

      if (!updated) {
        res.status(404).json({
          success: false,
          error: 'User not found',
        });
        return;
      }

      const user = await UserModel.findById(parseInt(id));

      res.status(200).json({
        success: true,
        data: user,
        message: 'User role updated successfully',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update user role',
      });
    }
  }

  async deleteUser(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const deleted = await UserModel.delete(parseInt(id));

      if (!deleted) {
        res.status(404).json({
          success: false,
          error: 'User not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'User deleted successfully',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete user',
      });
    }
  }

  async createSlot(req: Request, res: Response): Promise<void> {
    try {
      const { interview_id } = req.params;
      const { classroom_id, date, start_time, end_time, capacity, interviewer_ids } = req.body;

      const slot = await InterviewSlotModel.create({
        interview_id: parseInt(interview_id),
        classroom_id,
        date,
        start_time,
        end_time,
        capacity,
        interviewer_ids,
      });

      res.status(201).json({
        success: true,
        data: slot,
        message: 'Interview slot created successfully',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create interview slot',
      });
    }
  }

  async updateSlot(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { classroom_id, date, start_time, end_time, capacity, interviewer_ids } = req.body;

      const updated = await InterviewSlotModel.update(parseInt(id), {
        classroom_id,
        date,
        start_time,
        end_time,
        capacity,
        interviewer_ids,
      });

      if (!updated) {
        res.status(404).json({
          success: false,
          error: 'Slot not found',
        });
        return;
      }

      const slot = await InterviewSlotModel.findByIdWithDetails(parseInt(id));

      res.status(200).json({
        success: true,
        data: slot,
        message: 'Interview slot updated successfully',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update interview slot',
      });
    }
  }

  async deleteSlot(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const deleted = await InterviewSlotModel.delete(parseInt(id));

      if (!deleted) {
        res.status(404).json({
          success: false,
          error: 'Slot not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Interview slot deleted successfully',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete interview slot',
      });
    }
  }
}

export default new AdminController();
