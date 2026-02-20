import db from '../config/database';
import { RefreshToken } from '../types';

class RefreshTokenModel {
  private tableName = 'refresh_tokens';

  async create(data: {
    user_id: number;
    token: string;
    expiresAt: string;
  }): Promise<RefreshToken> {
    const stmt = db.prepare(
      `INSERT INTO ${this.tableName} (user_id, token, expires_at)
       VALUES (?, ?, ?)`
    );
    const result = stmt.run(data.user_id, data.token, data.expiresAt);
    return this.findById(result.lastInsertRowid as number) as Promise<RefreshToken>;
  }

  async findById(id: number): Promise<RefreshToken | null> {
    const stmt = db.prepare(`SELECT * FROM ${this.tableName} WHERE id = ?`);
    return stmt.get(id) as RefreshToken | null;
  }

  async findByToken(token: string): Promise<RefreshToken | null> {
    const stmt = db.prepare(`SELECT * FROM ${this.tableName} WHERE token = ?`);
    return stmt.get(token) as RefreshToken | null;
  }

  async findByUserId(userId: number): Promise<RefreshToken[]> {
    const stmt = db.prepare(
      `SELECT * FROM ${this.tableName} WHERE user_id = ? AND expires_at > datetime('now') ORDER BY created_at DESC`
    );
    return stmt.all(userId) as RefreshToken[];
  }

  async delete(id: number): Promise<boolean> {
    const stmt = db.prepare(`DELETE FROM ${this.tableName} WHERE id = ?`);
    const result = stmt.run(id);
    return result.changes > 0;
  }

  async deleteByToken(token: string): Promise<boolean> {
    const stmt = db.prepare(`DELETE FROM ${this.tableName} WHERE token = ?`);
    const result = stmt.run(token);
    return result.changes > 0;
  }

  async deleteAllForUser(userId: number): Promise<boolean> {
    const stmt = db.prepare(`DELETE FROM ${this.tableName} WHERE user_id = ?`);
    const result = stmt.run(userId);
    return result.changes > 0;
  }

  async cleanupExpired(): Promise<number> {
    const stmt = db.prepare(`DELETE FROM ${this.tableName} WHERE expires_at < datetime('now')`);
    const result = stmt.run();
    return result.changes;
  }

  async isValid(token: string): Promise<boolean> {
    const stmt = db.prepare(
      `SELECT * FROM ${this.tableName} WHERE token = ? AND expires_at > datetime('now')`
    );
    const result = stmt.get(token) as RefreshToken | undefined;
    return !!result;
  }
}

export default new RefreshTokenModel();
