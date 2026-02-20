import bcrypt from 'bcrypt';
import db from '../config/database';

async function seed() {
  console.log('Seeding database...');

  // Clean existing data
  db.exec('DELETE FROM refresh_tokens');
  db.exec('DELETE FROM notification_logs');
  db.exec('DELETE FROM verification_codes');
  db.exec('DELETE FROM registrations');
  db.exec('DELETE FROM interview_slots');
  db.exec('DELETE FROM interviews');
  db.exec('DELETE FROM question_banks');
  db.exec('DELETE FROM learning_resources');
  db.exec('DELETE FROM classrooms');
  db.exec('DELETE FROM users');

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10);
  db.prepare(`
    INSERT INTO users (email, password, name, role, is_verified)
    VALUES (?, ?, ?, ?, 1)
  `).run('admin@interview.com', adminPassword, 'Admin User', 'admin');

  // Create interviewer user
  const interviewerPassword = await bcrypt.hash('interviewer123', 10);
  const interviewerResult = db.prepare(`
    INSERT INTO users (email, password, name, role, is_verified)
    VALUES (?, ?, ?, ?, 1)
  `).run('interviewer@interview.com', interviewerPassword, 'Interviewer User', 'interviewer');

  // Create regular users
  const userPassword = await bcrypt.hash('user123', 10);
  db.prepare(`
    INSERT INTO users (email, password, name, role, is_verified, student_id, major, grade)
    VALUES (?, ?, ?, ?, 1, ?, ?, ?)
  `).run('user@example.com', userPassword, 'John Doe', 'user', '2021001', 'Computer Science', '2021');

  db.prepare(`
    INSERT INTO users (email, password, name, role, is_verified, student_id, major, grade)
    VALUES (?, ?, ?, ?, 1, ?, ?, ?)
  `).run('jane@example.com', userPassword, 'Jane Smith', 'user', '2021002', 'Software Engineering', '2021');

  db.prepare(`
    INSERT INTO users (email, password, name, role, is_verified, student_id, major, grade)
    VALUES (?, ?, ?, ?, 1, ?, ?, ?)
  `).run('bob@example.com', userPassword, 'Bob Johnson', 'user', '2021003', 'Computer Science', '2021');

  // Create classrooms
  const classroom1 = db.prepare(`
    INSERT INTO classrooms (name, location, capacity, equipment)
    VALUES (?, ?, ?, ?)
  `).run('Room 101', 'Building A, 1st Floor', 10, '["Projector", "Whiteboard", "Computer"]');

  const classroom2 = db.prepare(`
    INSERT INTO classrooms (name, location, capacity, equipment)
    VALUES (?, ?, ?, ?)
  `).run('Room 102', 'Building A, 2nd Floor', 8, '["Projector", "Whiteboard"]');

  const classroom3 = db.prepare(`
    INSERT INTO classrooms (name, location, capacity, equipment)
    VALUES (?, ?, ?, ?)
  `).run('Room 201', 'Building B, 2nd Floor', 15, '["Projector", "Sound System", "Computer"]');

  // Create sample questions
  db.prepare(`
    INSERT INTO question_banks (category, question, answer, difficulty, tags)
    VALUES (?, ?, ?, ?, ?)
  `).run(
    'Technical',
    'Explain the difference between let, const, and var in JavaScript.',
    'let: block-scoped, can be reassigned. const: block-scoped, cannot be reassigned. var: function-scoped, can be reassigned, hoisted.',
    'easy',
    '["javascript", "basics"]'
  );

  db.prepare(`
    INSERT INTO question_banks (category, question, answer, difficulty, tags)
    VALUES (?, ?, ?, ?, ?)
  `).run(
    'Technical',
    'What is the difference between == and === in JavaScript?',
    '== checks value equality with type coercion. === checks both value and type without coercion.',
    'easy',
    '["javascript", "operators"]'
  );

  db.prepare(`
    INSERT INTO question_banks (category, question, answer, difficulty, tags)
    VALUES (?, ?, ?, ?, ?)
  `).run(
    'Technical',
    'Explain the concept of closures in JavaScript.',
    'A closure is a function that has access to variables from its outer (enclosing) scope, even after the outer function has returned.',
    'medium',
    '["javascript", "functions"]'
  );

  db.prepare(`
    INSERT INTO question_banks (category, question, answer, difficulty, tags)
    VALUES (?, ?, ?, ?, ?)
  `).run(
    'Technical',
    'What is the Virtual DOM in React?',
    'The Virtual DOM is a lightweight JavaScript representation of the actual DOM. React uses it to optimize rendering by minimizing direct DOM manipulations.',
    'medium',
    '["react", "performance"]'
  );

  db.prepare(`
    INSERT INTO question_banks (category, question, answer, difficulty, tags)
    VALUES (?, ?, ?, ?, ?)
  `).run(
    'Behavioral',
    'Tell me about a time you had to work with a difficult team member.',
    'Answer should demonstrate conflict resolution, communication skills, and professionalism.',
    'medium',
    '["teamwork", "communication"]'
  );

  db.prepare(`
    INSERT INTO question_banks (category, question, answer, difficulty, tags)
    VALUES (?, ?, ?, ?, ?)
  `).run(
    'Behavioral',
    'Describe a situation where you had to learn a new technology quickly.',
    'Answer should demonstrate adaptability and learning ability.',
    'medium',
    '["learning", "adaptability"]'
  );

  // Create sample learning resources
  db.prepare(`
    INSERT INTO learning_resources (title, description, url, type, category)
    VALUES (?, ?, ?, ?, ?)
  `).run(
    'JavaScript Guide',
    'Comprehensive guide to modern JavaScript',
    'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide',
    'article',
    'Technical'
  );

  db.prepare(`
    INSERT INTO learning_resources (title, description, url, type, category)
    VALUES (?, ?, ?, ?, ?)
  `).run(
    'React Tutorial',
    'Learn React from scratch',
    'https://react.dev/learn',
    'article',
    'Technical'
  );

  db.prepare(`
    INSERT INTO learning_resources (title, description, url, type, category)
    VALUES (?, ?, ?, ?, ?)
  `).run(
    'Interview Preparation Tips',
    'Tips for acing your technical interview',
    null,
    'document',
    'Career'
  );

  // Create sample interviews
  const interview1 = db.prepare(`
    INSERT INTO interviews (title, description, position, department, location, interview_date, start_time, end_time, capacity, requirements, status, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    'Frontend Developer Interview',
    'We are looking for a skilled frontend developer to join our team.',
    'Frontend Developer',
    'Engineering',
    'Building A, Room 101',
    '2025-03-15',
    '09:00',
    '17:00',
    20,
    'Experience with React, TypeScript, and modern CSS.',
    'published',
    1
  );

  const interview2 = db.prepare(`
    INSERT INTO interviews (title, description, position, department, location, interview_date, start_time, end_time, capacity, requirements, status, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    'Backend Developer Interview',
    'Join our backend team to build scalable APIs and services.',
    'Backend Developer',
    'Engineering',
    'Building A, Room 102',
    '2025-03-20',
    '10:00',
    '18:00',
    15,
    'Experience with Node.js, databases, and API design.',
    'published',
    1
  );

  // Create interview slots
  const interview1Id = interview1.lastInsertRowid;
  const interview2Id = interview2.lastInsertRowid;

  db.prepare(`
    INSERT INTO interview_slots (interview_id, classroom_id, date, start_time, end_time, capacity, interviewer_ids)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(interview1Id, 1, '2025-03-15', '09:00', '10:00', 5, JSON.stringify([interviewerResult.lastInsertRowid]));

  db.prepare(`
    INSERT INTO interview_slots (interview_id, classroom_id, date, start_time, end_time, capacity, interviewer_ids)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(interview1Id, 1, '2025-03-15', '10:00', '11:00', 5, JSON.stringify([interviewerResult.lastInsertRowid]));

  db.prepare(`
    INSERT INTO interview_slots (interview_id, classroom_id, date, start_time, end_time, capacity, interviewer_ids)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(interview2Id, 2, '2025-03-20', '10:00', '11:00', 5, JSON.stringify([interviewerResult.lastInsertRowid]));

  db.prepare(`
    INSERT INTO interview_slots (interview_id, classroom_id, date, start_time, end_time, capacity, interviewer_ids)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(interview2Id, 2, '2025-03-20', '11:00', '12:00', 5, JSON.stringify([interviewerResult.lastInsertRowid]));

  console.log('Database seeded successfully!');
  console.log('\nDefault credentials:');
  console.log('Admin: admin@interview.com / admin123');
  console.log('Interviewer: interviewer@interview.com / interviewer123');
  console.log('User: user@example.com / user123');
}

seed().catch(console.error);
