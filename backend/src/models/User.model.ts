import db from '../config/database';
import { User, UserWithoutPassword, UserRole } from '../types';

class UserModel {
  private tableName = 'users';

  async findById(id: number): Promise<UserWithoutPassword | null> {
    const stmt = db.prepare(
      `SELECT id, email, name, role, avatar, phone, student_id, major, grade, is_verified, created_at, updated_at
       FROM ${this.tableName} WHERE id = ?`
    );
    return stmt.get(id) as UserWithoutPassword | null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const stmt = db.prepare(`SELECT * FROM ${this.tableName} WHERE email = ?`);
    return stmt.get(email) as User | null;
  }

  async create(data: {
    email: string;
    password: string;
    name: string;
    role?: UserRole;
    phone?: string;
    student_id?: string;
    major?: string;
    grade?: string;
  }): Promise<UserWithoutPassword> {
    const stmt = db.prepare(
      `INSERT INTO ${this.tableName} (email, password, name, role, phone, student_id, major, grade)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    );
    const result = stmt.run(
      data.email,
      data.password,
      data.name,
      data.role || 'user',
      data.phone || null,
      data.student_id || null,
      data.major || null,
      data.grade || null
    );
    return this.findById(result.lastInsertRowid as number) as Promise<UserWithoutPassword>;
  }

  async update(
    id: number,
    data: Partial<{
      name: string;
      role: UserRole;
      avatar: string;
      phone: string;
      student_id: string;
      major: string;
      grade: string;
      is_verified: number;
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

  async updatePassword(id: number, password: string): Promise<boolean> {
    const stmt = db.prepare(`UPDATE ${this.tableName} SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`);
    const result = stmt.run(password, id);
    return result.changes > 0;
  }

  async delete(id: number): Promise<boolean> {
    const stmt = db.prepare(`DELETE FROM ${this.tableName} WHERE id = ?`);
    const result = stmt.run(id);
    return result.changes > 0;
  }

  async findAll(options?: {
    role?: UserRole;
    limit?: number;
    offset?: number;
  }): Promise<UserWithoutPassword[]> {
    let query = `SELECT id, email, name, role, avatar, phone, student_id, major, grade, is_verified, created_at, updated_at FROM ${this.tableName}`;
    const params: any[] = [];

    if (options?.role) {
      query += ' WHERE role = ?';
      params.push(options.role);
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
    return stmt.all(...params) as UserWithoutPassword[];
  }

  async count(role?: UserRole): Promise<number> {
    let query = `SELECT COUNT(*) as count FROM ${this.tableName}`;
    const params: any[] = [];

    if (role) {
      query += ' WHERE role = ?';
      params.push(role);
    }

    const stmt = db.prepare(query);
    const result = stmt.get(...params) as { count: number };
    return result.count;
  }

  async setVerified(id: number): Promise<boolean> {
    const stmt = db.prepare(
      `UPDATE ${this.tableName} SET is_verified = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
    );
    const result = stmt.run(id);
    return result.changes > 0;
  }

  async findByStudentId(studentId: string): Promise<UserWithoutPassword | null> {
    const stmt = db.prepare(
      `SELECT id, email, name, role, avatar, phone, student_id, major, grade, is_verified, created_at, updated_at
       FROM ${this.tableName} WHERE student_id = ?`
    );
    return stmt.get(studentId) as UserWithoutPassword | null;
  }
}

export default new UserModel();
