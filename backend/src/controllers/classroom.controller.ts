import { Request, Response } from 'express';
import ClassroomModel from '../models/Classroom.model';
import InterviewSlotModel from '../models/InterviewSlot.model';

class ClassroomController {
  async getAllClassrooms(req: Request, res: Response): Promise<void> {
    try {
      const {
        is_available,
        min_capacity,
        page = '1',
        pageSize = '10',
      } = req.query;

      const pageNum = parseInt(page as string);
      const pageSizeNum = parseInt(pageSize as string);
      const offset = (pageNum - 1) * pageSizeNum;

      const classrooms = await ClassroomModel.findAll({
        isAvailable: is_available !== undefined ? parseInt(is_available as string) : undefined,
        minCapacity: min_capacity !== undefined ? parseInt(min_capacity as string) : undefined,
        limit: pageSizeNum,
        offset,
      });

      const total = await ClassroomModel.count({
        isAvailable: is_available !== undefined ? parseInt(is_available as string) : undefined,
      });

      res.status(200).json({
        success: true,
        data: {
          items: classrooms,
          total,
          page: pageNum,
          pageSize: pageSizeNum,
          totalPages: Math.ceil(total / pageSizeNum),
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch classrooms',
      });
    }
  }

  async getClassroomById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const classroom = await ClassroomModel.findById(parseInt(id));

      if (!classroom) {
        res.status(404).json({
          success: false,
          error: 'Classroom not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: classroom,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch classroom',
      });
    }
  }

  async getAvailableClassrooms(req: Request, res: Response): Promise<void> {
    try {
      const { date, start_time, end_time } = req.query;

      if (!date || !start_time || !end_time) {
        res.status(400).json({
          success: false,
          error: 'date, start_time, and end_time are required',
        });
        return;
      }

      const classrooms = await ClassroomModel.getAvailable(
        date as string,
        start_time as string,
        end_time as string
      );

      res.status(200).json({
        success: true,
        data: classrooms,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch available classrooms',
      });
    }
  }

  async createClassroom(req: Request, res: Response): Promise<void> {
    try {
      const { name, location, capacity, equipment } = req.body;

      const classroom = await ClassroomModel.create({
        name,
        location,
        capacity,
        equipment: equipment ? JSON.stringify(equipment) : undefined,
      });

      res.status(201).json({
        success: true,
        data: classroom,
        message: 'Classroom created successfully',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create classroom',
      });
    }
  }

  async updateClassroom(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { name, location, capacity, equipment, is_available } = req.body;

      const updated = await ClassroomModel.update(parseInt(id), {
        name,
        location,
        capacity,
        equipment: equipment ? JSON.stringify(equipment) : undefined,
        is_available: is_available !== undefined ? (is_available ? 1 : 0) : undefined,
      });

      if (!updated) {
        res.status(404).json({
          success: false,
          error: 'Classroom not found',
        });
        return;
      }

      const classroom = await ClassroomModel.findById(parseInt(id));

      res.status(200).json({
        success: true,
        data: classroom,
        message: 'Classroom updated successfully',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update classroom',
      });
    }
  }

  async deleteClassroom(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const deleted = await ClassroomModel.delete(parseInt(id));

      if (!deleted) {
        res.status(404).json({
          success: false,
          error: 'Classroom not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Classroom deleted successfully',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete classroom',
      });
    }
  }
}

export default new ClassroomController();
