import { Request, Response } from 'express';
import UserModel from '../models/User.model';
import InterviewSlotModel from '../models/InterviewSlot.model';
import RegistrationModel from '../models/Registration.model';
import { AccessTokenPayload } from '../types';

class UserController {
  async getProfile(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req.user as AccessTokenPayload).userId;
      const user = await UserModel.findById(userId);

      if (!user) {
        res.status(404).json({
          success: false,
          error: 'User not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: user,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch profile',
      });
    }
  }

  async updateProfile(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req.user as AccessTokenPayload).userId;
      const { name, phone, student_id, major, grade } = req.body;

      const updated = await UserModel.update(userId, {
        name,
        phone,
        student_id,
        major,
        grade,
      });

      if (!updated) {
        res.status(404).json({
          success: false,
          error: 'User not found',
        });
        return;
      }

      const user = await UserModel.findById(userId);

      res.status(200).json({
        success: true,
        data: user,
        message: 'Profile updated successfully',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update profile',
      });
    }
  }

  async uploadAvatar(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req.user as AccessTokenPayload).userId;
      // This is a placeholder - actual file upload would be handled by multer
      const avatarUrl = req.body?.avatar_url || (req as any).file?.path;

      if (!avatarUrl) {
        res.status(400).json({
          success: false,
          error: 'Avatar URL is required',
        });
        return;
      }

      const updated = await UserModel.update(userId, { avatar: avatarUrl });

      if (!updated) {
        res.status(404).json({
          success: false,
          error: 'User not found',
        });
        return;
      }

      const user = await UserModel.findById(userId);

      res.status(200).json({
        success: true,
        data: user,
        message: 'Avatar uploaded successfully',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to upload avatar',
      });
    }
  }

  async getMyInterviews(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req.user as AccessTokenPayload).userId;
      const { status } = req.query;

      const registrations = await RegistrationModel.findByUserId(userId, {
        status: status as any,
      });

      // Get slot details for confirmed/pending registrations
      const registrationsWithSlots = await Promise.all(
        registrations.map(async (reg) => {
          let slot = null;
          if (reg.slot_id) {
            slot = await InterviewSlotModel.findByIdWithDetails(reg.slot_id);
          }
          return {
            ...reg,
            slot,
          };
        })
      );

      res.status(200).json({
        success: true,
        data: registrationsWithSlots,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch interviews',
      });
    }
  }
}

export default new UserController();
