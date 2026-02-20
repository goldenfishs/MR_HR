import db from '../config/database';
import { InterviewSlot, InterviewSlotWithDetails } from '../types';

class InterviewSlotModel {
  private tableName = 'interview_slots';

  async findById(id: number): Promise<InterviewSlot | null> {
    const stmt = db.prepare(`SELECT * FROM ${this.tableName} WHERE id = ?`);
    return stmt.get(id) as InterviewSlot | null;
  }

  async findByIdWithDetails(id: number): Promise<InterviewSlotWithDetails | null> {
    const stmt = db.prepare(`
      SELECT
        s.*,
        c.id as classroom_id, c.name as classroom_name, c.location as classroom_location, c.capacity as classroom_capacity, c.equipment as classroom_equipment
      FROM ${this.tableName} s
      LEFT JOIN classrooms c ON s.classroom_id = c.id
      WHERE s.id = ?
    `);
    const row = stmt.get(id) as any;

    if (!row) return null;

    const result: InterviewSlotWithDetails = {
      id: row.id,
      interview_id: row.interview_id,
      classroom_id: row.classroom_id,
      date: row.date,
      start_time: row.start_time,
      end_time: row.end_time,
      capacity: row.capacity,
      booked_count: row.booked_count,
      interviewer_ids: row.interviewer_ids,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };

    if (row.classroom_id) {
      result.classroom = {
        id: row.classroom_id,
        name: row.classroom_name,
        location: row.classroom_location,
        capacity: row.classroom_capacity,
        equipment: row.classroom_equipment,
        is_available: 1,
        created_at: row.created_at,
        updated_at: row.updated_at,
      };
    }

    // Parse interviewer IDs and get interviewer details
    if (row.interviewer_ids) {
      try {
        const interviewerIds = JSON.parse(row.interviewer_ids) as number[];
        const interviewers: any[] = [];
        for (const interviewerId of interviewerIds) {
          const userStmt = db.prepare(
            `SELECT id, email, name, role, avatar, phone, is_verified, created_at, updated_at FROM users WHERE id = ?`
          );
          const user = userStmt.get(interviewerId);
          if (user) {
            interviewers.push(user);
          }
        }
        result.interviewers = interviewers;
      } catch (e) {
        // Invalid JSON
      }
    }

    return result;
  }

  async create(data: {
    interview_id: number;
    classroom_id?: number;
    date: string;
    start_time: string;
    end_time: string;
    capacity: number;
    interviewer_ids?: number[];
  }): Promise<InterviewSlot> {
    const interviewerIdsJson = data.interviewer_ids ? JSON.stringify(data.interviewer_ids) : null;

    const stmt = db.prepare(
      `INSERT INTO ${this.tableName} (interview_id, classroom_id, date, start_time, end_time, capacity, interviewer_ids)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    );
    const result = stmt.run(
      data.interview_id,
      data.classroom_id || null,
      data.date,
      data.start_time,
      data.end_time,
      data.capacity,
      interviewerIdsJson
    );
    return this.findById(result.lastInsertRowid as number) as Promise<InterviewSlot>;
  }

  async update(
    id: number,
    data: Partial<{
      classroom_id: number;
      date: string;
      start_time: string;
      end_time: string;
      capacity: number;
      booked_count: number;
      interviewer_ids: number[];
    }>
  ): Promise<boolean> {
    const fields: string[] = [];
    const values: any[] = [];

    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        if (key === 'interviewer_ids') {
          fields.push(`${key} = ?`);
          values.push(JSON.stringify(value));
        } else {
          fields.push(`${key} = ?`);
          values.push(value);
        }
      }
    });

    if (fields.length === 0) return false;

    values.push(id);
    const stmt = db.prepare(
      `UPDATE ${this.tableName} SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
    );
    const result = stmt.run(...values);
    return result.changes > 0;
  }

  async delete(id: number): Promise<boolean> {
    const stmt = db.prepare(`DELETE FROM ${this.tableName} WHERE id = ?`);
    const result = stmt.run(id);
    return result.changes > 0;
  }

  async findByInterviewId(interviewId: number): Promise<InterviewSlot[]> {
    const stmt = db.prepare(
      `SELECT * FROM ${this.tableName} WHERE interview_id = ? ORDER BY date, start_time`
    );
    return stmt.all(interviewId) as InterviewSlot[];
  }

  async findByClassroomId(classroomId: number): Promise<InterviewSlot[]> {
    const stmt = db.prepare(
      `SELECT * FROM ${this.tableName} WHERE classroom_id = ? ORDER BY date, start_time`
    );
    return stmt.all(classroomId) as InterviewSlot[];
  }

  async findByInterviewerId(interviewerId: number): Promise<InterviewSlotWithDetails[]> {
    const stmt = db.prepare(`
      SELECT s.*
      FROM ${this.tableName} s
      WHERE s.interviewer_ids IS NOT NULL AND s.interviewer_ids != ''
      ORDER BY s.date, s.start_time
    `);
    const rows = stmt.all() as InterviewSlot[];

    const results: InterviewSlotWithDetails[] = [];
    for (const row of rows) {
      // Parse interviewer IDs to verify
      if (row.interviewer_ids) {
        try {
          const interviewerIds = JSON.parse(row.interviewer_ids) as number[];
          if (interviewerIds.includes(interviewerId)) {
            results.push(await this.findByIdWithDetails(row.id) as InterviewSlotWithDetails);
          }
        } catch (e) {
          // Invalid JSON, skip
        }
      }
    }

    return results;
  }

  async incrementBookedCount(id: number): Promise<boolean> {
    const stmt = db.prepare(
      `UPDATE ${this.tableName} SET booked_count = booked_count + 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
    );
    const result = stmt.run(id);
    return result.changes > 0;
  }

  async decrementBookedCount(id: number): Promise<boolean> {
    const stmt = db.prepare(
      `UPDATE ${this.tableName} SET booked_count = CASE WHEN booked_count > 0 THEN booked_count - 1 ELSE 0 END, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
    );
    const result = stmt.run(id);
    return result.changes > 0;
  }

  async getAvailableSlots(interviewId: number): Promise<InterviewSlot[]> {
    const stmt = db.prepare(`
      SELECT * FROM ${this.tableName}
      WHERE interview_id = ?
      AND booked_count < capacity
      ORDER BY date, start_time
    `);
    return stmt.all(interviewId) as InterviewSlot[];
  }

  async isAvailable(slotId: number): Promise<boolean> {
    const slot = await this.findById(slotId);
    if (!slot) return false;
    return slot.booked_count < slot.capacity;
  }
}

export default new InterviewSlotModel();
