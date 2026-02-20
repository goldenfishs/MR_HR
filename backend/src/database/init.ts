import fs from 'fs';
import path from 'path';
import db from '../config/database';

const schemaPath = path.join(__dirname, '../../database/schema.sql');

// Read and execute schema
const schema = fs.readFileSync(schemaPath, 'utf-8');

// Split by semicolon and execute each statement
const statements = schema
  .split(';')
  .map(s => s.trim())
  .filter(s => s.length > 0);

for (const statement of statements) {
  try {
    db.exec(statement);
  } catch (error) {
    console.error('Error executing statement:', statement);
    console.error(error);
  }
}

console.log('Database initialized successfully!');
