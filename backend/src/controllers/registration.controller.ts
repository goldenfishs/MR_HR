import { Request, Response } from 'express';
import db from '../config/database';
import RegistrationModel from '../models/Registration.model';
import InterviewModel from '../models/Interview.model';
import InterviewSlotModel from '../models/InterviewSlot.model';
import EmailService from '../services/email.service';
import { AccessTokenPayload, Registration, RegistrationStatus, RegistrationWithDetails } from '../types';

class RegistrationController {
  private isInterviewerAssigned(interviewerIdsRaw: string | undefined, interviewerId: number): boolean {
    if (!interviewerIdsRaw) {
      return false;
    }

    try {
      const interviewerIds = JSON.parse(interviewerIdsRaw) as number[];
      return Array.isArray(interviewerIds) && interviewerIds.includes(interviewerId);
    } catch {
      return false;
    }
  }

  private async canInterviewerAccessRegistration(
    registration: RegistrationWithDetails,
    interviewerId: number
  ): Promise<boolean> {
    if (!registration.slot_id) {
      return false;
    }

    const slot = registration.slot || await InterviewSlotModel.findById(registration.slot_id);
    if (!slot) {
      return false;
    }

    return this.isInterviewerAssigned(slot.interviewer_ids, interviewerId);
  }

  async getMyRegistrations(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req.user as AccessTokenPayload).userId;
      const { status } = req.query;

      const registrations = await RegistrationModel.findByUserId(userId, {
        status: status as RegistrationStatus,
      });

      const registrationsWithDetails = await Promise.all(
        registrations.map(async (reg) => {
          const interview = await InterviewModel.findById(reg.interview_id);
          const slot = reg.slot_id ? await InterviewSlotModel.findByIdWithDetails(reg.slot_id) : null;
          return {
            ...reg,
            interview,
            slot,
          };
        })
      );

      res.status(200).json({
        success: true,
        data: registrationsWithDetails,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch registrations',
      });
    }
  }

  async getRegistrationById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const requester = req.user as AccessTokenPayload;
      const registration = await RegistrationModel.findByIdWithDetails(parseInt(id, 10));

      if (!registration) {
        res.status(404).json({
          success: false,
          error: 'Registration not found',
        });
        return;
      }

      if (requester.role === 'user' && registration.user_id !== requester.userId) {
        res.status(403).json({
          success: false,
          error: 'Not authorized to view this registration',
        });
        return;
      }

      if (requester.role === 'interviewer') {
        const canAccess = await this.canInterviewerAccessRegistration(registration, requester.userId);
        if (!canAccess) {
          res.status(403).json({
            success: false,
            error: 'Not authorized to view this registration',
          });
          return;
        }
      }

      res.status(200).json({
        success: true,
        data: registration,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch registration',
      });
    }
  }

  async createRegistration(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req.user as AccessTokenPayload).userId;
      const { interview_id, slot_id, resume_url, answers, notes } = req.body as {
        interview_id: number;
        slot_id?: number | null;
        resume_url?: string;
        answers?: Record<string, unknown> | null;
        notes?: string;
      };

      const interview = await InterviewModel.findById(interview_id);
      if (!interview) {
        res.status(404).json({
          success: false,
          error: 'Interview not found',
        });
        return;
      }

      if (interview.status !== 'published') {
        res.status(400).json({
          success: false,
          error: 'Interview is not open for registration',
        });
        return;
      }

      const createRegistrationTx = db.transaction(() => {
        const existing = db
          .prepare(
            `SELECT id FROM registrations WHERE user_id = ? AND interview_id = ? LIMIT 1`
          )
          .get(userId, interview_id) as { id: number } | undefined;

        if (existing) {
          throw new Error('Already registered for this interview');
        }

        if (slot_id) {
          const slot = db
            .prepare(
              `SELECT id, interview_id, capacity, booked_count FROM interview_slots WHERE id = ?`
            )
            .get(slot_id) as
            | {
                id: number;
                interview_id: number;
                capacity: number;
                booked_count: number;
              }
            | undefined;

          if (!slot) {
            throw new Error('Slot not found');
          }

          if (slot.interview_id !== interview_id) {
            throw new Error('Selected slot does not belong to this interview');
          }

          const reserveSlot = db
            .prepare(
              `UPDATE interview_slots
               SET booked_count = booked_count + 1, updated_at = CURRENT_TIMESTAMP
               WHERE id = ? AND booked_count < capacity`
            )
            .run(slot_id);

          if (reserveSlot.changes === 0) {
            throw new Error('Slot is full');
          }
        }

        const insert = db
          .prepare(
            `INSERT INTO registrations (user_id, interview_id, slot_id, resume_url, answers, notes)
             VALUES (?, ?, ?, ?, ?, ?)`
          )
          .run(
            userId,
            interview_id,
            slot_id || null,
            resume_url || null,
            answers ? JSON.stringify(answers) : null,
            notes || null
          );

        const registration = db
          .prepare(`SELECT * FROM registrations WHERE id = ?`)
          .get(insert.lastInsertRowid as number) as Registration | undefined;

        if (!registration) {
          throw new Error('Failed to create registration');
        }

        return registration;
      });

      const registration = createRegistrationTx();

      const UserModel = (await import('../models/User.model')).default;
      UserModel.findById(userId).then((user) => {
        if (user) {
          EmailService.sendRegistrationConfirmation(
            user.email,
            user.name,
            interview.title,
            interview.interview_date,
            `${interview.start_time} - ${interview.end_time}`,
            userId
          ).catch((err) => console.error('Email send failed:', err));
        }
      });

      res.status(201).json({
        success: true,
        data: registration,
        message: 'Registration successful',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create registration';
      const status =
        message === 'Slot not found'
          ? 404
          : 400;

      res.status(status).json({
        success: false,
        error: message,
      });
    }
  }

  async cancelRegistration(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req.user as AccessTokenPayload).userId;
      const { id } = req.params;
      const registrationId = parseInt(id, 10);

      const registration = await RegistrationModel.findById(registrationId);
      if (!registration) {
        res.status(404).json({
          success: false,
          error: 'Registration not found',
        });
        return;
      }

      const userRole = (req.user as AccessTokenPayload).role;
      if (registration.user_id !== userId && userRole !== 'admin') {
        res.status(403).json({
          success: false,
          error: 'Not authorized to cancel this registration',
        });
        return;
      }

      if (registration.status === 'cancelled') {
        res.status(400).json({
          success: false,
          error: 'Registration is already cancelled',
        });
        return;
      }

      if (registration.slot_id) {
        await InterviewSlotModel.decrementBookedCount(registration.slot_id);
      }

      await RegistrationModel.updateStatus(registrationId, 'cancelled');

      res.status(200).json({
        success: true,
        message: 'Registration cancelled successfully',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to cancel registration',
      });
    }
  }

  async updateRegistrationStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { status } = req.body as { status: RegistrationStatus };
      const registrationId = parseInt(id, 10);

      const updateStatusTx = db.transaction(() => {
        const registration = db
          .prepare(`SELECT * FROM registrations WHERE id = ?`)
          .get(registrationId) as Registration | undefined;

        if (!registration) {
          throw new Error('Registration not found');
        }

        if (registration.status === status) {
          return 'unchanged';
        }

        if (registration.slot_id) {
          if (registration.status !== 'cancelled' && status === 'cancelled') {
            db.prepare(
              `UPDATE interview_slots
               SET booked_count = CASE WHEN booked_count > 0 THEN booked_count - 1 ELSE 0 END,
                   updated_at = CURRENT_TIMESTAMP
               WHERE id = ?`
            ).run(registration.slot_id);
          }

          if (registration.status === 'cancelled' && status !== 'cancelled') {
            const reserveSlot = db.prepare(
              `UPDATE interview_slots
               SET booked_count = booked_count + 1,
                   updated_at = CURRENT_TIMESTAMP
               WHERE id = ? AND booked_count < capacity`
            ).run(registration.slot_id);

            if (reserveSlot.changes === 0) {
              throw new Error('Slot is full');
            }
          }
        }

        db.prepare(
          `UPDATE registrations SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
        ).run(status, registrationId);

        return 'updated';
      });

      const updateResult = updateStatusTx();

      res.status(200).json({
        success: true,
        message:
          updateResult === 'unchanged'
            ? 'Registration status unchanged'
            : 'Registration status updated successfully',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update status';
      const statusCode = message === 'Registration not found' ? 404 : 400;

      res.status(statusCode).json({
        success: false,
        error: message,
      });
    }
  }

  async scoreRegistration(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { score, feedback } = req.body as { score: number; feedback?: string };
      const requester = req.user as AccessTokenPayload;
      const registrationId = parseInt(id, 10);

      const registration = await RegistrationModel.findByIdWithDetails(registrationId);
      if (!registration) {
        res.status(404).json({
          success: false,
          error: 'Registration not found',
        });
        return;
      }

      if (requester.role === 'interviewer') {
        const canScore = await this.canInterviewerAccessRegistration(registration, requester.userId);
        if (!canScore) {
          res.status(403).json({
            success: false,
            error: 'Not authorized to score this registration',
          });
          return;
        }
      }

      if (!['confirmed', 'completed'].includes(registration.status)) {
        res.status(400).json({
          success: false,
          error: 'Only confirmed/completed registrations can be scored',
        });
        return;
      }

      await RegistrationModel.update(registrationId, {
        interview_score: score,
        interview_feedback: feedback,
        status: 'completed',
      });

      res.status(200).json({
        success: true,
        message: 'Score submitted successfully',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to submit score',
      });
    }
  }

  async announceResult(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const registrationId = parseInt(id, 10);

      const registration = await RegistrationModel.findByIdWithDetails(registrationId);
      if (!registration) {
        res.status(404).json({
          success: false,
          error: 'Registration not found',
        });
        return;
      }

      if (registration.interview_score === undefined || registration.interview_score === null) {
        res.status(400).json({
          success: false,
          error: 'Cannot announce result before scoring',
        });
        return;
      }

      const passed = registration.interview_score >= 60;
      await RegistrationModel.update(registrationId, {
        result_announced: 1,
        status: passed ? 'completed' : 'failed',
      });

      if (registration.user && registration.interview) {
        EmailService.sendInterviewResult(
          registration.user.email,
          registration.user.name,
          registration.interview.title,
          passed ? 'passed' : 'failed',
          registration.interview_score,
          registration.interview_feedback,
          registration.user_id
        ).catch((err) => console.error('Email send failed:', err));
      }

      res.status(200).json({
        success: true,
        message: 'Result announced successfully',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to announce result',
      });
    }
  }

  async getAllRegistrations(req: Request, res: Response): Promise<void> {
    try {
      const requester = req.user as AccessTokenPayload;
      const {
        interview_id,
        status,
        page = '1',
        pageSize = '10',
      } = req.query;

      let registrations = interview_id
        ? await RegistrationModel.findByInterviewId(parseInt(interview_id as string, 10), {
            status: status as RegistrationStatus,
          })
        : await RegistrationModel.findAllWithDetails({
            status: status as RegistrationStatus,
          });

      if (requester.role === 'interviewer') {
        registrations = registrations.filter(
          (registration) =>
            registration.slot && this.isInterviewerAssigned(registration.slot.interviewer_ids, requester.userId)
        );
      }

      const pageNum = parseInt(page as string, 10);
      const pageSizeNum = parseInt(pageSize as string, 10);
      const start = (pageNum - 1) * pageSizeNum;
      const paginated = registrations.slice(start, start + pageSizeNum);

      res.status(200).json({
        success: true,
        data: {
          items: paginated,
          total: registrations.length,
          page: pageNum,
          pageSize: pageSizeNum,
          totalPages: Math.ceil(registrations.length / pageSizeNum),
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch registrations',
      });
    }
  }
}

export default new RegistrationController();
