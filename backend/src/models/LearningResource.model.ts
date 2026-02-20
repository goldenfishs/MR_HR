import db from '../config/database';
import { LearningResource, ResourceType } from '../types';

class LearningResourceModel {
  private tableName = 'learning_resources';

  async findById(id: number): Promise<LearningResource | null> {
    const stmt = db.prepare(`SELECT * FROM ${this.tableName} WHERE id = ?`);
    return stmt.get(id) as LearningResource | null;
  }

  async create(data: {
    title: string;
    description?: string;
    url?: string;
    type: ResourceType;
    category?: string;
  }): Promise<LearningResource> {
    const stmt = db.prepare(
      `INSERT INTO ${this.tableName} (title, description, url, type, category)
       VALUES (?, ?, ?, ?, ?)`
    );
    const result = stmt.run(
      data.title,
      data.description || null,
      data.url || null,
      data.type,
      data.category || null
    );
    return this.findById(result.lastInsertRowid as number) as Promise<LearningResource>;
  }

  async update(
    id: number,
    data: Partial<{
      title: string;
      description: string;
      url: string;
      type: ResourceType;
      category: string;
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
    const stmt = db.prepare(`UPDATE ${this.tableName} SET ${fields.join(', ')} WHERE id = ?`);
    const result = stmt.run(...values);
    return result.changes > 0;
  }

  async delete(id: number): Promise<boolean> {
    const stmt = db.prepare(`DELETE FROM ${this.tableName} WHERE id = ?`);
    const result = stmt.run(id);
    return result.changes > 0;
  }

  async findAll(options?: {
    type?: ResourceType;
    category?: string;
    limit?: number;
    offset?: number;
  }): Promise<LearningResource[]> {
    let query = `SELECT * FROM ${this.tableName}`;
    const params: any[] = [];
    const conditions: string[] = [];

    if (options?.type) {
      conditions.push('type = ?');
      params.push(options.type);
    }

    if (options?.category) {
      conditions.push('category = ?');
      params.push(options.category);
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
    return stmt.all(...params) as LearningResource[];
  }

  async getCategories(): Promise<string[]> {
    const stmt = db.prepare(`SELECT DISTINCT category FROM ${this.tableName} WHERE category IS NOT NULL ORDER BY category`);
    const rows = stmt.all() as { category: string }[];
    return rows.map(r => r.category);
  }

  async count(options?: { type?: ResourceType; category?: string }): Promise<number> {
    let query = `SELECT COUNT(*) as count FROM ${this.tableName}`;
    const params: any[] = [];
    const conditions: string[] = [];

    if (options?.type) {
      conditions.push('type = ?');
      params.push(options.type);
    }

    if (options?.category) {
      conditions.push('category = ?');
      params.push(options.category);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    const stmt = db.prepare(query);
    const result = stmt.get(...params) as { count: number };
    return result.count;
  }
}

export default new LearningResourceModel();
