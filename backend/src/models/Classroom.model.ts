import db from '../config/database';
import { Classroom } from '../types';

class ClassroomModel {
  private tableName = 'classrooms';

  async findById(id: number): Promise<Classroom | null> {
    const stmt = db.prepare(`SELECT * FROM ${this.tableName} WHERE id = ?`);
    return stmt.get(id) as Classroom | null;
  }

  async create(data: {
    name: string;
    location?: string;
    capacity: number;
    equipment?: string;
  }): Promise<Classroom> {
    const stmt = db.prepare(
      `INSERT INTO ${this.tableName} (name, location, capacity, equipment)
       VALUES (?, ?, ?, ?)`
    );
    const result = stmt.run(data.name, data.location || null, data.capacity, data.equipment || null);
    return this.findById(result.lastInsertRowid as number) as Promise<Classroom>;
  }

  async update(
    id: number,
    data: Partial<{
      name: string;
      location: string;
      capacity: number;
      equipment: string;
      is_available: number;
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
    isAvailable?: number;
    minCapacity?: number;
    limit?: number;
    offset?: number;
  }): Promise<Classroom[]> {
    let query = `SELECT * FROM ${this.tableName}`;
    const params: any[] = [];
    const conditions: string[] = [];

    if (options?.isAvailable !== undefined) {
      conditions.push('is_available = ?');
      params.push(options.isAvailable);
    }

    if (options?.minCapacity !== undefined) {
      conditions.push('capacity >= ?');
      params.push(options.minCapacity);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY capacity ASC, name ASC';

    if (options?.limit) {
      query += ' LIMIT ?';
      params.push(options.limit);
      if (options?.offset) {
        query += ' OFFSET ?';
        params.push(options.offset);
      }
    }

    const stmt = db.prepare(query);
    return stmt.all(...params) as Classroom[];
  }

  async getAvailable(date: string, startTime: string, endTime: string): Promise<Classroom[]> {
    const stmt = db.prepare(`
      SELECT c.* FROM ${this.tableName} c
      WHERE c.is_available = 1
      AND c.id NOT IN (
        SELECT DISTINCT s.classroom_id
        FROM interview_slots s
        WHERE s.date = ?
        AND (
          (s.start_time < ? AND s.end_time > ?) OR
          (s.start_time >= ? AND s.start_time < ?) OR
          (s.end_time > ? AND s.end_time <= ?)
        )
      )
      ORDER BY c.capacity ASC, c.name ASC
    `);
    return stmt.all(date, endTime, startTime, startTime, endTime, startTime, endTime) as Classroom[];
  }

  async count(options?: { isAvailable?: number }): Promise<number> {
    let query = `SELECT COUNT(*) as count FROM ${this.tableName}`;
    const params: any[] = [];

    if (options?.isAvailable !== undefined) {
      query += ' WHERE is_available = ?';
      params.push(options.isAvailable);
    }

    const stmt = db.prepare(query);
    const result = stmt.get(...params) as { count: number };
    return result.count;
  }

  async setAvailability(id: number, isAvailable: number): Promise<boolean> {
    const stmt = db.prepare(
      `UPDATE ${this.tableName} SET is_available = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
    );
    const result = stmt.run(isAvailable, id);
    return result.changes > 0;
  }
}

export default new ClassroomModel();
