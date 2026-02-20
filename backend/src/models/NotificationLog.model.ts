import db from '../config/database';
import { NotificationLog, NotificationType, NotificationPurpose, NotificationStatus } from '../types';

class NotificationLogModel {
  private tableName = 'notification_logs';

  async create(data: {
    user_id?: number;
    type: NotificationType;
    purpose: NotificationPurpose;
    content?: string;
  }): Promise<NotificationLog> {
    const stmt = db.prepare(
      `INSERT INTO ${this.tableName} (user_id, type, purpose, content, status)
       VALUES (?, ?, ?, ?, 'pending')`
    );
    const result = stmt.run(data.user_id || null, data.type, data.purpose, data.content || null);
    return this.findById(result.lastInsertRowid as number) as Promise<NotificationLog>;
  }

  async findById(id: number): Promise<NotificationLog | null> {
    const stmt = db.prepare(`SELECT * FROM ${this.tableName} WHERE id = ?`);
    return stmt.get(id) as NotificationLog | null;
  }

  async updateStatus(id: number, status: NotificationStatus): Promise<boolean> {
    const sentAt = status === 'sent' ? 'sent_at = datetime("now"), ' : '';
    const stmt = db.prepare(
      `UPDATE ${this.tableName} SET ${sentAt}status = ? WHERE id = ?`
    );
    const result = stmt.run(status, id);
    return result.changes > 0;
  }

  async findByUserId(userId: number, options?: {
    type?: NotificationType;
    purpose?: NotificationPurpose;
    limit?: number;
  }): Promise<NotificationLog[]> {
    let query = `SELECT * FROM ${this.tableName} WHERE user_id = ?`;
    const params: any[] = [userId];

    if (options?.type) {
      query += ' AND type = ?';
      params.push(options.type);
    }

    if (options?.purpose) {
      query += ' AND purpose = ?';
      params.push(options.purpose);
    }

    query += ' ORDER BY created_at DESC';

    if (options?.limit) {
      query += ' LIMIT ?';
      params.push(options.limit);
    }

    const stmt = db.prepare(query);
    return stmt.all(...params) as NotificationLog[];
  }

  async findAll(options?: {
    type?: NotificationType;
    status?: NotificationStatus;
    limit?: number;
    offset?: number;
  }): Promise<NotificationLog[]> {
    let query = `SELECT * FROM ${this.tableName}`;
    const params: any[] = [];
    const conditions: string[] = [];

    if (options?.type) {
      conditions.push('type = ?');
      params.push(options.type);
    }

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
    return stmt.all(...params) as NotificationLog[];
  }

  async cleanupOld(days: number = 30): Promise<number> {
    const stmt = db.prepare(
      `DELETE FROM ${this.tableName} WHERE created_at < datetime('now', '-' || ? || ' days')`
    );
    const result = stmt.run(days);
    return result.changes;
  }
}

export default new NotificationLogModel();
