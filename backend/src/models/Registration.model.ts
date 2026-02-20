import db from '../config/database';
import { Registration, RegistrationWithDetails, RegistrationStatus } from '../types';

class RegistrationModel {
  private tableName = 'registrations';
  private detailedSelect = `
    SELECT
      r.*,
      u.id as user_ref_id,
      u.email as user_email,
      u.name as user_name,
      u.role as user_role,
      u.avatar as user_avatar,
      u.phone as user_phone,
      u.student_id as user_student_id,
      u.major as user_major,
      u.grade as user_grade,
      u.is_verified as user_is_verified,
      u.created_at as user_created_at,
      u.updated_at as user_updated_at,
      i.id as interview_ref_id,
      i.title as interview_title,
      i.description as interview_description,
      i.position as interview_position,
      i.department as interview_department,
      i.location as interview_location,
      i.interview_date as interview_date,
      i.start_time as interview_start_time,
      i.end_time as interview_end_time,
      i.capacity as interview_capacity,
      i.requirements as interview_requirements,
      i.status as interview_status,
      i.created_by as interview_created_by,
      i.created_at as interview_created_at,
      i.updated_at as interview_updated_at,
      s.id as slot_ref_id,
      s.interview_id as slot_interview_id,
      s.classroom_id as slot_classroom_id,
      s.date as slot_date,
      s.start_time as slot_start_time,
      s.end_time as slot_end_time,
      s.capacity as slot_capacity,
      s.booked_count as slot_booked_count,
      s.interviewer_ids as slot_interviewer_ids,
      s.created_at as slot_created_at,
      s.updated_at as slot_updated_at,
      c.id as classroom_ref_id,
      c.name as classroom_name,
      c.location as classroom_location,
      c.capacity as classroom_capacity,
      c.equipment as classroom_equipment,
      c.is_available as classroom_is_available,
      c.created_at as classroom_created_at,
      c.updated_at as classroom_updated_at
    FROM ${this.tableName} r
    LEFT JOIN users u ON r.user_id = u.id
    LEFT JOIN interviews i ON r.interview_id = i.id
    LEFT JOIN interview_slots s ON r.slot_id = s.id
    LEFT JOIN classrooms c ON s.classroom_id = c.id
  `;

  private mapDetailedRow(row: any): RegistrationWithDetails {
    const result: RegistrationWithDetails = {
      id: row.id,
      user_id: row.user_id,
      interview_id: row.interview_id,
      slot_id: row.slot_id,
      status: row.status,
      resume_url: row.resume_url,
      answers: row.answers,
      notes: row.notes,
      interview_score: row.interview_score,
      interview_feedback: row.interview_feedback,
      result_announced: row.result_announced,
      interview_time: row.interview_time,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };

    if (row.user_ref_id) {
      result.user = {
        id: row.user_ref_id,
        email: row.user_email,
        name: row.user_name,
        role: row.user_role,
        avatar: row.user_avatar,
        phone: row.user_phone,
        student_id: row.user_student_id,
        major: row.user_major,
        grade: row.user_grade,
        is_verified: row.user_is_verified,
        created_at: row.user_created_at,
        updated_at: row.user_updated_at,
      };
    }

    if (row.interview_ref_id) {
      result.interview = {
        id: row.interview_ref_id,
        title: row.interview_title,
        description: row.interview_description,
        position: row.interview_position,
        department: row.interview_department,
        location: row.interview_location,
        interview_date: row.interview_date,
        start_time: row.interview_start_time,
        end_time: row.interview_end_time,
        capacity: row.interview_capacity,
        requirements: row.interview_requirements,
        status: row.interview_status,
        created_by: row.interview_created_by,
        created_at: row.interview_created_at,
        updated_at: row.interview_updated_at,
      };
    }

    if (row.slot_ref_id) {
      result.slot = {
        id: row.slot_ref_id,
        interview_id: row.slot_interview_id,
        classroom_id: row.slot_classroom_id,
        date: row.slot_date,
        start_time: row.slot_start_time,
        end_time: row.slot_end_time,
        capacity: row.slot_capacity,
        booked_count: row.slot_booked_count,
        interviewer_ids: row.slot_interviewer_ids,
        created_at: row.slot_created_at,
        updated_at: row.slot_updated_at,
      };

      if (row.classroom_ref_id) {
        result.slot.classroom = {
          id: row.classroom_ref_id,
          name: row.classroom_name,
          location: row.classroom_location,
          capacity: row.classroom_capacity,
          equipment: row.classroom_equipment,
          is_available: row.classroom_is_available,
          created_at: row.classroom_created_at,
          updated_at: row.classroom_updated_at,
        };
      }
    }

    return result;
  }

  async findById(id: number): Promise<Registration | null> {
    const stmt = db.prepare(`SELECT * FROM ${this.tableName} WHERE id = ?`);
    return stmt.get(id) as Registration | null;
  }

  async findByIdWithDetails(id: number): Promise<RegistrationWithDetails | null> {
    const stmt = db.prepare(`${this.detailedSelect} WHERE r.id = ?`);
    const row = stmt.get(id) as any;
    if (!row) return null;
    return this.mapDetailedRow(row);
  }

  async findByUserAndInterview(userId: number, interviewId: number): Promise<Registration | null> {
    const stmt = db.prepare(`SELECT * FROM ${this.tableName} WHERE user_id = ? AND interview_id = ?`);
    return stmt.get(userId, interviewId) as Registration | null;
  }

  async create(data: {
    user_id: number;
    interview_id: number;
    slot_id?: number;
    resume_url?: string;
    answers?: string;
    notes?: string;
  }): Promise<Registration> {
    const stmt = db.prepare(
      `INSERT INTO ${this.tableName} (user_id, interview_id, slot_id, resume_url, answers, notes)
       VALUES (?, ?, ?, ?, ?, ?)`
    );
    const result = stmt.run(
      data.user_id,
      data.interview_id,
      data.slot_id || null,
      data.resume_url || null,
      data.answers || null,
      data.notes || null
    );
    return this.findById(result.lastInsertRowid as number) as Promise<Registration>;
  }

  async update(
    id: number,
    data: Partial<{
      status: RegistrationStatus;
      slot_id: number;
      resume_url: string;
      answers: string;
      notes: string;
      interview_score: number;
      interview_feedback: string;
      result_announced: number;
      interview_time: string;
    }>
  ): Promise<boolean> {
    const fields: string[] = [];
    const values: any[] = [];

    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        fields.push(`${key} = ?`);
        values.push(value);
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

  async findByUserId(userId: number, options?: { status?: RegistrationStatus }): Promise<Registration[]> {
    let query = `SELECT * FROM ${this.tableName} WHERE user_id = ?`;
    const params: any[] = [userId];

    if (options?.status) {
      query += ' AND status = ?';
      params.push(options.status);
    }

    query += ' ORDER BY created_at DESC';

    const stmt = db.prepare(query);
    return stmt.all(...params) as Registration[];
  }

  async findByInterviewId(
    interviewId: number,
    options?: { status?: RegistrationStatus }
  ): Promise<RegistrationWithDetails[]> {
    let query = `${this.detailedSelect} WHERE r.interview_id = ?`;
    const params: any[] = [interviewId];

    if (options?.status) {
      query += ' AND r.status = ?';
      params.push(options.status);
    }

    query += ' ORDER BY r.created_at DESC';

    const stmt = db.prepare(query);
    const rows = stmt.all(...params) as any[];
    return rows.map((row) => this.mapDetailedRow(row));
  }

  async findAllWithDetails(options?: {
    status?: RegistrationStatus;
    limit?: number;
    offset?: number;
  }): Promise<RegistrationWithDetails[]> {
    let query = this.detailedSelect;
    const params: any[] = [];
    const conditions: string[] = [];

    if (options?.status) {
      conditions.push('r.status = ?');
      params.push(options.status);
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    query += ' ORDER BY r.created_at DESC';

    if (options?.limit) {
      query += ' LIMIT ?';
      params.push(options.limit);
      if (options.offset) {
        query += ' OFFSET ?';
        params.push(options.offset);
      }
    }

    const stmt = db.prepare(query);
    const rows = stmt.all(...params) as any[];
    return rows.map((row) => this.mapDetailedRow(row));
  }

  async count(options?: {
    userId?: number;
    interviewId?: number;
    status?: RegistrationStatus;
  }): Promise<number> {
    let query = `SELECT COUNT(*) as count FROM ${this.tableName}`;
    const params: any[] = [];
    const conditions: string[] = [];

    if (options?.userId) {
      conditions.push('user_id = ?');
      params.push(options.userId);
    }

    if (options?.interviewId) {
      conditions.push('interview_id = ?');
      params.push(options.interviewId);
    }

    if (options?.status) {
      conditions.push('status = ?');
      params.push(options.status);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    const stmt = db.prepare(query);
    const result = stmt.get(...params) as { count: number };
    return result.count;
  }

  async updateStatus(id: number, status: RegistrationStatus): Promise<boolean> {
    const stmt = db.prepare(
      `UPDATE ${this.tableName} SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
    );
    const result = stmt.run(status, id);
    return result.changes > 0;
  }

  async findAll(options?: {
    limit?: number;
    offset?: number;
    status?: RegistrationStatus;
  }): Promise<Registration[]> {
    let query = `SELECT * FROM ${this.tableName}`;
    const params: any[] = [];
    const conditions: string[] = [];

    if (options?.status) {
      conditions.push('status = ?');
      params.push(options.status);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY created_at DESC';

    if (options?.limit) {
      query += ' LIMIT ?';
      params.push(options.limit);
      if (options?.offset) {
        query += ' OFFSET ?';
        params.push(options.offset);
      }
    }

    const stmt = db.prepare(query);
    return stmt.all(...params) as Registration[];
  }
}

export default new RegistrationModel();
