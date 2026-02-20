import { Request, Response } from 'express';
import InterviewModel from '../models/Interview.model';
import InterviewSlotModel from '../models/InterviewSlot.model';
import RegistrationModel from '../models/Registration.model';
import { AccessTokenPayload } from '../types';

class InterviewController {
  async getAllInterviews(req: Request, res: Response): Promise<void> {
    try {
      const {
        status,
        search,
        page = '1',
        pageSize = '10',
      } = req.query;

      const pageNum = parseInt(page as string);
      const pageSizeNum = parseInt(pageSize as string);
      const offset = (pageNum - 1) * pageSizeNum;

      const interviews = await InterviewModel.findAll({
        status: status as any,
        search: search as string,
        limit: pageSizeNum,
        offset,
      });

      const total = await InterviewModel.count({ status: status as any });

      res.status(200).json({
        success: true,
        data: {
          items: interviews,
          total,
          page: pageNum,
          pageSize: pageSizeNum,
          totalPages: Math.ceil(total / pageSizeNum),
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch interviews',
      });
    }
  }

  async getInterviewById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const interview = await InterviewModel.findByIdWithDetails(parseInt(id));

      if (!interview) {
        res.status(404).json({
          success: false,
          error: 'Interview not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: interview,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch interview',
      });
    }
  }

  async createInterview(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req.user as AccessTokenPayload).userId;
      const {
        title,
        description,
        position,
        department,
        location,
        interview_date,
        start_time,
        end_time,
        capacity,
        requirements,
      } = req.body;

      const interview = await InterviewModel.create({
        title,
        description,
        position,
        department,
        location,
        interview_date,
        start_time,
        end_time,
        capacity,
        requirements,
        created_by: userId,
      });

      res.status(201).json({
        success: true,
        data: interview,
        message: 'Interview created successfully',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create interview',
      });
    }
  }

  async updateInterview(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const {
        title,
        description,
        position,
        department,
        location,
        interview_date,
        start_time,
        end_time,
        capacity,
        requirements,
        status,
      } = req.body;

      const updated = await InterviewModel.update(parseInt(id), {
        title,
        description,
        position,
        department,
        location,
        interview_date,
        start_time,
        end_time,
        capacity,
        requirements,
        status,
      });

      if (!updated) {
        res.status(404).json({
          success: false,
          error: 'Interview not found',
        });
        return;
      }

      const interview = await InterviewModel.findById(parseInt(id));

      res.status(200).json({
        success: true,
        data: interview,
        message: 'Interview updated successfully',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update interview',
      });
    }
  }

  async deleteInterview(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const deleted = await InterviewModel.delete(parseInt(id));

      if (!deleted) {
        res.status(404).json({
          success: false,
          error: 'Interview not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Interview deleted successfully',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete interview',
      });
    }
  }

  async publishInterview(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updated = await InterviewModel.update(parseInt(id), { status: 'published' });

      if (!updated) {
        res.status(404).json({
          success: false,
          error: 'Interview not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Interview published successfully',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to publish interview',
      });
    }
  }

  async closeInterview(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updated = await InterviewModel.update(parseInt(id), { status: 'closed' });

      if (!updated) {
        res.status(404).json({
          success: false,
          error: 'Interview not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Interview closed successfully',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to close interview',
      });
    }
  }

  async getInterviewSlots(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const slots = await InterviewSlotModel.findByInterviewId(parseInt(id));

      res.status(200).json({
        success: true,
        data: slots,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch interview slots',
      });
    }
  }

  async getInterviewRegistrations(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { status } = req.query;

      const registrations = await RegistrationModel.findByInterviewId(parseInt(id), {
        status: status as any,
      });

      res.status(200).json({
        success: true,
        data: registrations,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch registrations',
      });
    }
  }

  async getAvailableSlots(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const slots = await InterviewSlotModel.getAvailableSlots(parseInt(id));

      res.status(200).json({
        success: true,
        data: slots,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch available slots',
      });
    }
  }
}

export default new InterviewController();
