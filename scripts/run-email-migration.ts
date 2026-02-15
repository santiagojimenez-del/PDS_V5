/**
 * Run Email Log Table Migration
 *
 * Usage: tsx scripts/run-email-migration.ts
 */

import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';

async function runMigration() {
  console.log('📊 Running Email_Log table migration...\n');

  try {
    // Create connection
    const connection = await mysql.createConnection({
      host: 'localhost',
      port: 3309,
      user: 'root',
      password: 'devroot123',
      database: 'prodrones_application',
    });

    console.log('✅ Connected to database');

    // Read migration file
    const migrationPath = path.join(process.cwd(), 'migrations', 'add-email-log-table.sql');
    const sql = fs.readFileSync(migrationPath, 'utf-8');

    console.log('📄 Running migration SQL...');

    // Execute migration
    await connection.query(sql);

    console.log('✅ Email_Log table created successfully!');

    // Verify table exists
    const [tables] = await connection.query(
      "SHOW TABLES LIKE 'Email_Log'"
    );

    if (Array.isArray(tables) && tables.length > 0) {
      console.log('✅ Table verified in database');

      // Show table structure
      const [columns] = await connection.query('DESCRIBE Email_Log');
      console.log('\n📋 Table structure:');
      console.table(columns);
    }

    await connection.end();
    console.log('\n🎉 Migration completed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
