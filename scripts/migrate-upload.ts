import { readFileSync } from "fs";
import { resolve } from "path";
import mysql from "mysql2/promise";

// ---------------------------------------------------------------------------
// Load .env manually (avoid dependency on dotenv)
// ---------------------------------------------------------------------------
function loadEnv() {
    try {
        const envPath = resolve(__dirname, "..", ".env");
        const content = readFileSync(envPath, "utf-8");
        for (const line of content.split("\n")) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith("#")) continue;
            const eqIdx = trimmed.indexOf("=");
            if (eqIdx === -1) continue;
            const key = trimmed.slice(0, eqIdx).trim();
            const val = trimmed.slice(eqIdx + 1).trim();
            if (!process.env[key]) {
                process.env[key] = val;
            }
        }
    } catch {
        // .env not found - rely on env vars
    }
}

loadEnv();

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
    console.error("DATABASE_URL not set");
    process.exit(1);
}

async function main() {
    console.log("Connecting to database...", DATABASE_URL);

    const connection = await mysql.createConnection({
        uri: DATABASE_URL,
        multipleStatements: true,
    });

    try {
        const sqlPath = resolve(__dirname, "../migrations/add-upload-tables.sql");
        const sql = readFileSync(sqlPath, "utf-8");

        console.log("Executing migration...");

        // Split by statement if needed, or run as one block if multipleStatements supported
        // Since SQL contains comments and multiple creates, multipleStatements: true handles it usually.
        // However, CREATE TABLE IF NOT EXISTS is idempotent.

        await connection.query(sql);

        console.log("Migration completed successfully!");

        // Verify tables
        const [rows] = await connection.query(`
      SELECT TABLE_NAME 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME IN ('Upload_Session', 'Upload_Chunk')
    `);

        console.log("Created tables:", rows);

    } catch (error) {
        console.error("Migration failed:", error);
        process.exit(1);
    } finally {
        await connection.end();
    }
}

main();
