import db from '../config/database';
import { Interview, InterviewWithDetails, InterviewStatus } from '../types';

class InterviewModel {
  private tableName = 'interviews';

  async findById(id: number): Promise<Interview | null> {
    const stmt = db.prepare(`SELECT * FROM ${this.tableName} WHERE id = ?`);
    return stmt.get(id) as Interview | null;
  }

  async findByIdWithDetails(id: number): Promise<InterviewWithDetails | null> {
    const stmt = db.prepare(`
      SELECT
        i.*,
        u.id as creator_id, u.email as creator_email, u.name as creator_name, u.role as creator_role
      FROM ${this.tableName} i
      LEFT JOIN users u ON i.created_by = u.id
      WHERE i.id = ?
    `);
    const row = stmt.get(id) as any;

    if (!row) return null;

    const result: InterviewWithDetails = {
      id: row.id,
      title: row.title,
      description: row.description,
      position: row.position,
      department: row.department,
      location: row.location,
      interview_date: row.interview_date,
      start_time: row.start_time,
      end_time: row.end_time,
      capacity: row.capacity,
      requirements: row.requirements,
      status: row.status,
      created_by: row.created_by,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };

    if (row.creator_id) {
      result.creator = {
        id: row.creator_id,
        email: row.creator_email,
        name: row.creator_name,
        role: row.creator_role,
        is_verified: 1,
        created_at: row.created_at,
        updated_at: row.updated_at,
      };
    }

    // Get registered count
    const countStmt = db.prepare(`SELECT COUNT(*) as count FROM registrations WHERE interview_id = ?`);
    const countResult = countStmt.get(id) as { count: number };
    result.registered_count = countResult.count;

    return result;
  }

  async create(data: {
    title: string;
    description?: string;
    position: string;
    department?: string;
    location?: string;
    interview_date: string;
    start_time: string;
    end_time: string;
    capacity: number;
    requirements?: string;
    status?: InterviewStatus;
    created_by: number;
  }): Promise<Interview> {
    const stmt = db.prepare(
      `INSERT INTO ${this.tableName}
       (title, description, position, department, location, interview_date, start_time, end_time, capacity, requirements, status, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    const result = stmt.run(
      data.title,
      data.description || null,
      data.position,
      data.department || null,
      data.location || null,
      data.interview_date,
      data.start_time,
      data.end_time,
      data.capacity,
      data.requirements || null,
      data.status || 'draft',
      data.created_by
    );
    return this.findById(result.lastInsertRowid as number) as Promise<Interview>;
  }

  async update(
    id: number,
    data: Partial<{
      title: string;
      description: string;
      position: string;
      department: string;
      location: string;
      interview_date: string;
      start_time: string;
      end_time: string;
      capacity: number;
      requirements: string;
      status: InterviewStatus;
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

  async findAll(options?: {
    status?: InterviewStatus;
    position?: string;
    department?: string;
    limit?: number;
    offset?: number;
    search?: string;
  }): Promise<Interview[]> {
    let query = `SELECT * FROM ${this.tableName}`;
    const params: any[] = [];
    const conditions: string[] = [];

    if (options?.status) {
      conditions.push('status = ?');
      params.push(options.status);
    }

    if (options?.search) {
      conditions.push('(title LIKE ? OR description LIKE ? OR position LIKE ?)');
      const searchTerm = `%${options.search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY interview_date DESC, created_at DESC';

    if (options?.limit) {
      query += ' LIMIT ?';
      params.push(options.limit);
      if (options?.offset) {
        query += ' OFFSET ?';
        params.push(options.offset);
      }
    }

    const stmt = db.prepare(query);
    return stmt.all(...params) as Interview[];
  }

  async count(options?: { status?: InterviewStatus }): Promise<number> {
    let query = `SELECT COUNT(*) as count FROM ${this.tableName}`;
    const params: any[] = [];

    if (options?.status) {
      query += ' WHERE status = ?';
      params.push(options.status);
    }

    const stmt = db.prepare(query);
    const result = stmt.get(...params) as { count: number };
    return result.count;
  }
}

export default new InterviewModel();
