import db from '../config/database';
import { QuestionBank, QuestionBankWithCreator, QuestionDifficulty } from '../types';

class QuestionBankModel {
  private tableName = 'question_banks';

  async findById(id: number): Promise<QuestionBank | null> {
    const stmt = db.prepare(`SELECT * FROM ${this.tableName} WHERE id = ?`);
    return stmt.get(id) as QuestionBank | null;
  }

  async create(data: {
    category: string;
    question: string;
    answer?: string;
    difficulty?: QuestionDifficulty;
    tags?: string;
    created_by?: number;
  }): Promise<QuestionBank> {
    const stmt = db.prepare(
      `INSERT INTO ${this.tableName} (category, question, answer, difficulty, tags, created_by)
       VALUES (?, ?, ?, ?, ?, ?)`
    );
    const result = stmt.run(
      data.category,
      data.question,
      data.answer || null,
      data.difficulty || null,
      data.tags || null,
      data.created_by || null
    );
    return this.findById(result.lastInsertRowid as number) as Promise<QuestionBank>;
  }

  async update(
    id: number,
    data: Partial<{
      category: string;
      question: string;
      answer: string;
      difficulty: QuestionDifficulty;
      tags: string;
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
    category?: string;
    difficulty?: QuestionDifficulty;
    limit?: number;
    offset?: number;
  }): Promise<QuestionBank[]> {
    let query = `SELECT * FROM ${this.tableName}`;
    const params: any[] = [];
    const conditions: string[] = [];

    if (options?.category) {
      conditions.push('category = ?');
      params.push(options.category);
    }

    if (options?.difficulty) {
      conditions.push('difficulty = ?');
      params.push(options.difficulty);
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
    return stmt.all(...params) as QuestionBank[];
  }

  async findByCategory(category: string): Promise<QuestionBank[]> {
    const stmt = db.prepare(`SELECT * FROM ${this.tableName} WHERE category = ? ORDER BY created_at DESC`);
    return stmt.all(category) as QuestionBank[];
  }

  async getCategories(): Promise<string[]> {
    const stmt = db.prepare(`SELECT DISTINCT category FROM ${this.tableName} ORDER BY category`);
    const rows = stmt.all() as { category: string }[];
    return rows.map(r => r.category);
  }

  async getRandom(count: number = 1, category?: string): Promise<QuestionBank[]> {
    let query = `SELECT * FROM ${this.tableName}`;
    const params: any[] = [];

    if (category) {
      query += ' WHERE category = ?';
      params.push(category);
    }

    query += ' ORDER BY RANDOM() LIMIT ?';
    params.push(count);

    const stmt = db.prepare(query);
    return stmt.all(...params) as QuestionBank[];
  }

  async count(category?: string): Promise<number> {
    let query = `SELECT COUNT(*) as count FROM ${this.tableName}`;
    const params: any[] = [];

    if (category) {
      query += ' WHERE category = ?';
      params.push(category);
    }

    const stmt = db.prepare(query);
    const result = stmt.get(...params) as { count: number };
    return result.count;
  }

  async search(keyword: string, options?: {
    category?: string;
    difficulty?: QuestionDifficulty;
    limit?: number;
    offset?: number;
  }): Promise<QuestionBank[]> {
    let query = `SELECT * FROM ${this.tableName} WHERE question LIKE ?`;
    const params: any[] = [`%${keyword}%`];

    if (options?.category) {
      query += ' AND category = ?';
      params.push(options.category);
    }

    if (options?.difficulty) {
      query += ' AND difficulty = ?';
      params.push(options.difficulty);
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
    return stmt.all(...params) as QuestionBank[];
  }
}

export default new QuestionBankModel();
