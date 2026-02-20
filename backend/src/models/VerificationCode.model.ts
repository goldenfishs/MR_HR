import db from '../config/database';
import { VerificationCode, VerificationCodeType } from '../types';

class VerificationCodeModel {
  private tableName = 'verification_codes';

  async create(data: {
    email: string;
    code: string;
    type: VerificationCodeType;
    expiresAt: string;
  }): Promise<VerificationCode> {
    const stmt = db.prepare(
      `INSERT INTO ${this.tableName} (email, code, type, expires_at)
       VALUES (?, ?, ?, ?)`
    );
    const result = stmt.run(data.email, data.code, data.type, data.expiresAt);
    return this.findById(result.lastInsertRowid as number) as Promise<VerificationCode>;
  }

  async findById(id: number): Promise<VerificationCode | null> {
    const stmt = db.prepare(`SELECT * FROM ${this.tableName} WHERE id = ?`);
    return stmt.get(id) as VerificationCode | null;
  }

  async findLatestValidCode(email: string, type: VerificationCodeType): Promise<VerificationCode | null> {
    const stmt = db.prepare(
      `SELECT * FROM ${this.tableName}
       WHERE email = ? AND type = ? AND used = 0 AND expires_at > datetime('now')
       ORDER BY created_at DESC LIMIT 1`
    );
    return stmt.get(email, type) as VerificationCode | null;
  }

  async verifyCode(email: string, code: string, type: VerificationCodeType): Promise<boolean> {
    const stmt = db.prepare(
      `SELECT * FROM ${this.tableName}
       WHERE email = ? AND code = ? AND type = ? AND used = 0 AND expires_at > datetime('now')
       ORDER BY created_at DESC LIMIT 1`
    );
    const result = stmt.get(email, code, type) as VerificationCode | undefined;

    if (result) {
      // Mark as used
      this.markAsUsed(result.id);
      return true;
    }
    return false;
  }

  async markAsUsed(id: number): Promise<boolean> {
    const stmt = db.prepare(`UPDATE ${this.tableName} SET used = 1 WHERE id = ?`);
    const result = stmt.run(id);
    return result.changes > 0;
  }

  async invalidatePreviousCodes(email: string, type: VerificationCodeType): Promise<boolean> {
    const stmt = db.prepare(
      `UPDATE ${this.tableName} SET used = 1 WHERE email = ? AND type = ? AND used = 0`
    );
    const result = stmt.run(email, type);
    return result.changes > 0;
  }

  async cleanupExpired(): Promise<number> {
    const stmt = db.prepare(`DELETE FROM ${this.tableName} WHERE expires_at < datetime('now', '-1 day')`);
    const result = stmt.run();
    return result.changes;
  }

  generateCode(): string {
    // Generate a 6-digit numeric code
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
}

export default new VerificationCodeModel();
