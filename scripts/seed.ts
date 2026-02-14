/**
 * ProDrones Hub - Database Seed Script
 *
 * Usage:
 *   npx tsx scripts/seed.ts          # Insert seed data
 *   npx tsx scripts/seed.ts --reset  # TRUNCATE all tables, then re-seed
 *
 * Reads DATABASE_URL and DATABASE_SSL from .env (or env vars).
 */

import { readFileSync } from "fs";
import { resolve } from "path";
import mysql from "mysql2/promise";
import { hash } from "bcryptjs";

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

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("ERROR: DATABASE_URL is not set");
  process.exit(1);
}

const useSSL = process.env.DATABASE_SSL?.trim() === "true";
const isReset = process.argv.includes("--reset");

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------
const PASSWORD = "Test1234!";
const BCRYPT_COST = 11;

interface UserDef {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  roles: number[];
}

const USERS: UserDef[] = [
  { id: 1, email: "admin@prodrones.com", firstName: "Andres", lastName: "Salamanca", roles: [0] },
  { id: 2, email: "manager@prodrones.com", firstName: "Carlos", lastName: "Rivera", roles: [7] },
  { id: 3, email: "pilot1@prodrones.com", firstName: "Marco", lastName: "Diaz", roles: [6] },
  { id: 4, email: "pilot2@prodrones.com", firstName: "Sofia", lastName: "Chen", roles: [6] },
  { id: 5, email: "staff@prodrones.com", firstName: "James", lastName: "Mitchell", roles: [5] },
  { id: 6, email: "client1@prodrones.com", firstName: "Robert", lastName: "Thompson", roles: [1] },
  { id: 7, email: "client2@prodrones.com", firstName: "Maria", lastName: "Gonzalez", roles: [1] },
  { id: 8, email: "developer@prodrones.com", firstName: "Alex", lastName: "Park", roles: [4] },
  { id: 9, email: "registered@prodrones.com", firstName: "David", lastName: "Brown", roles: [3] },
  { id: 10, email: "multi@prodrones.com", firstName: "Nicole", lastName: "Vasquez", roles: [5, 7] },
];

// ---------------------------------------------------------------------------
// Tables in truncation order (respects FK constraints)
// ---------------------------------------------------------------------------
const TRUNCATE_ORDER = [
  "Delivery_Email_Items",
  "Delivery_Email_Outbox",
  "Bulk_Action_Log",
  "Shares",
  "Requests",
  "Logs",
  "Job_Deliverable",
  "Job_Meta",
  "Recurring_Job_Occurrences",
  "Recurring_Job_Templates",
  "Jobs",
  "Organization_Meta",
  "Organization",
  "Sites",
  "Tilesets",
  "User_Meta",
  "Users",
  "Pages",
  "Templates",
  "Permissions",
  "Products",
  "Configuration",
];

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  console.log(`Connecting to database...`);
  console.log(`Mode: ${isReset ? "RESET (truncate + seed)" : "SEED (insert only)"}`);

  const pool = await mysql.createPool({
    uri: DATABASE_URL,
    ssl: useSSL ? { rejectUnauthorized: false } : undefined,
    multipleStatements: true,
  });

  const conn = await pool.getConnection();

  try {
    // Hash password
    console.log("Hashing password...");
    const passwordHash = await hash(PASSWORD, BCRYPT_COST);

    await conn.query("SET FOREIGN_KEY_CHECKS = 0");

    if (isReset) {
      console.log("Truncating all tables...");
      for (const table of TRUNCATE_ORDER) {
        try {
          await conn.query(`TRUNCATE TABLE \`${table}\``);
        } catch {
          // Table might not exist yet
        }
      }
    }

    // ---- Users ----
    console.log("Seeding Users...");
    for (const u of USERS) {
      await conn.query(
        "INSERT INTO `Users` (`ID`, `Email`, `Password`, `Tokens`) VALUES (?, ?, ?, '[]')",
        [u.id, u.email, passwordHash]
      );
    }

    // ---- User_Meta ----
    console.log("Seeding User_Meta...");
    for (const u of USERS) {
      const metas: [string, string][] = [
        ["first_name", u.firstName],
        ["last_name", u.lastName],
        ["roles", JSON.stringify(u.roles)],
        ["permissions", "[]"],
      ];
      for (const [key, val] of metas) {
        await conn.query(
          "INSERT INTO `User_Meta` (`uid`, `meta_key`, `meta_value`) VALUES (?, ?, ?)",
          [u.id, key, val]
        );
      }
    }

    // ---- Configuration (bug fix: globals use '*') ----
    console.log("Seeding Configuration...");
    const configs: [string, string, string][] = [
      ["*", "api_server", "/api"],
      ["*", "login_form", "login"],
      ["*", "session_name", "pds_session"],
      ["*", "request_token_var", "request"],
      ["*", "share_token_var", "share"],
      ["*", "primary_app", "hub"],
      ["*", "mail_email", "office@prodrones.com"],
      ["*", "mail_name", "PDS"],
      ["*", "maintenance", JSON.stringify({ enabled: false, whitelist: [1], message: "System is under maintenance." })],
      ["*", "roles", JSON.stringify([
        { id: 0, name: "Admin", app: "hub", default: false, superadmin: true, authentication: true, permissions: [] },
        { id: 1, name: "Client", app: "client", default: false, superadmin: false, authentication: false, permissions: [] },
        { id: 3, name: "Registered", app: "hub", default: false, superadmin: false, authentication: false, permissions: [] },
        { id: 4, name: "Developer", app: "hub", default: false, superadmin: false, authentication: false, permissions: [] },
        { id: 5, name: "Staff", app: "hub", default: true, superadmin: false, authentication: false, permissions: [] },
        { id: 6, name: "Pilot", app: "hub", default: false, superadmin: false, authentication: false, permissions: [] },
        { id: 7, name: "Manager", app: "hub", default: false, superadmin: false, authentication: false, permissions: [] },
      ])],
      ["*", "pipes", JSON.stringify([
        { id: "bids", name: "Bids", color: "#6366f1" },
        { id: "scheduled", name: "Scheduled", color: "#f59e0b" },
        { id: "processing-deliver", name: "Processing / Deliver", color: "#3b82f6" },
        { id: "bill", name: "Bill", color: "#10b981" },
        { id: "completed", name: "Completed", color: "#6b7280" },
      ])],
      ["hub", "domain", "hub.prodrones.com"],
      ["hub", "role_access", "[0, 7, 5, 6]"],
      ["hub", "site_title", "ProDrones Hub"],
      ["hub", "site_logo", "/img/logo/PDSLogo1-ud02.2022.png"],
      ["hub", "site_logo_sm", "/img/logo/PDSLogo-sm.png"],
      ["hub", "cdn_server", "http://localhost:3005"],
      ["hub", "socket_server", "http://localhost:3005"],
      ["client", "domain", "client.prodrones.com"],
      ["client", "client_role", "1"],
      ["client", "site_title", "ProDrones Client Portal"],
      ["client", "role_access", "[1]"],
      ["admin", "domain", "admin.prodrones.com"],
      ["admin", "site_title", "ProDrones Admin"],
      ["admin", "role_access", "[0]"],
    ];
    for (const [app, name, value] of configs) {
      await conn.query(
        "INSERT INTO `Configuration` (`Application`, `Name`, `Value`) VALUES (?, ?, ?)",
        [app, name, value]
      );
    }

    // ---- Products ----
    console.log("Seeding Products...");
    const products: [number, string, string | null, string, string | null][] = [
      [1, "Landscape Viewer", "landscape_viewer", "[]", "{}"],
      [2, "Community Viewer", "community_viewer", "[]", "{}"],
      [3, "Construct Viewer", "construct_viewer", "[]", "{}"],
      [4, "Custom Photography", null, "[]", null],
      [5, "Roof Inspection", null, "[]", null],
      [6, "Progress Video", null, "[]", null],
      [7, "Orthomosaic Map", null, "[]", null],
      [8, "3D Model", null, "[]", null],
    ];
    for (const [id, name, tpl, meta, cfg] of products) {
      await conn.query(
        "INSERT INTO `Products` (`id`, `name`, `deliverable_template`, `meta_defaults`, `configuration`) VALUES (?, ?, ?, ?, ?)",
        [id, name, tpl, meta, cfg]
      );
    }

    // ---- Permissions ----
    console.log("Seeding Permissions...");
    const perms: [string, string, string, string, number][] = [
      ["create_project_site", "Project Management", "Create Site", "Can create new project sites", 1],
      ["create_tileset", "Tileset Management", "Create Tileset", "Can create and upload tilesets", 2],
      ["delete_tileset", "Tileset Management", "Delete Tileset", "Can delete tilesets", 2],
      ["onboard_company", "Company Management", "Onboard Company", "Can create new companies", 3],
      ["manage_company", "Company Management", "Manage Company", "Can manage existing companies", 3],
      ["view_all_jobs", "Job Management", "View All Jobs", "Can view all jobs regardless of assignment", 1],
      ["view_roles_and_permissions", "Roles & Permissions", "View Roles", "Can view roles and permissions page", 5],
      ["manage_roles_and_permissions", "Roles & Permissions", "Manage Roles", "Can modify roles and permissions", 5],
      ["developer_tools", "General", "Developer Tools", "Access to developer tools", 6],
      ["bulk_approve", "Job Management", "Bulk Approve", "Can bulk approve bids", 1],
      ["bulk_deliver", "Job Management", "Bulk Deliver", "Can bulk deliver jobs", 1],
    ];
    for (const [name, cat, label, desc, pri] of perms) {
      await conn.query(
        "INSERT INTO `Permissions` (`name`, `category`, `label`, `description`, `priority`, `hidden`, `enforce`) VALUES (?, ?, ?, ?, ?, 0, 1)",
        [name, cat, label, desc, pri]
      );
    }

    // ---- Organizations ----
    console.log("Seeding Organizations...");
    const orgs = [
      [1, "Coastal Development Group"],
      [2, "Sunrise HOA Management"],
      [3, "Tampa Bay Construction LLC"],
      [4, "Everglades Environmental Services"],
      [5, "Palm Beach Realty Corp"],
    ];
    for (const [id, name] of orgs) {
      await conn.query("INSERT INTO `Organization` (`id`, `name`) VALUES (?, ?)", [id, name]);
    }

    // ---- Organization_Meta (bug fix: contacts are flat arrays) ----
    console.log("Seeding Organization_Meta...");
    const orgMetas: [number, string, string][] = [
      [1, "contacts", "[6]"],
      [1, "StreetAddress", "200 Biscayne Blvd"],
      [1, "City", "Miami"],
      [1, "State", "FL"],
      [1, "ZipCode", "33131"],
      [2, "contacts", "[6]"],
      [2, "StreetAddress", "1500 E Sunrise Blvd"],
      [2, "City", "Fort Lauderdale"],
      [2, "State", "FL"],
      [2, "ZipCode", "33304"],
      [3, "contacts", "[7]"],
      [3, "StreetAddress", "400 N Tampa St"],
      [3, "City", "Tampa"],
      [3, "State", "FL"],
      [3, "ZipCode", "33602"],
      [4, "contacts", "[7]"],
      [4, "StreetAddress", "900 5th Ave S"],
      [4, "City", "Naples"],
      [4, "State", "FL"],
      [4, "ZipCode", "34102"],
      [5, "contacts", "[6,7]"],
      [5, "StreetAddress", "777 S Flagler Dr"],
      [5, "City", "West Palm Beach"],
      [5, "State", "FL"],
      [5, "ZipCode", "33401"],
    ];
    for (const [orgId, key, val] of orgMetas) {
      await conn.query(
        "INSERT INTO `Organization_Meta` (`org_id`, `meta_key`, `meta_value`) VALUES (?, ?, ?)",
        [orgId, key, val]
      );
    }

    // ---- Sites ----
    console.log("Seeding Sites...");
    await conn.query(`
      INSERT INTO \`Sites\` (\`id\`, \`createdBy\`, \`name\`, \`description\`, \`address\`, \`coordinates\`, \`boundary\`) VALUES
      (1, 1, 'Downtown Miami Office Complex', 'Multi-story office building aerial survey and roof inspection', '200 S Biscayne Blvd, Miami, FL 33131', '{"lat":25.77,"lng":-80.19}', NULL),
      (2, 2, 'Sunrise Lakes HOA', 'Residential community aerial mapping for HOA property assessment', '2800 W Sunrise Blvd, Fort Lauderdale, FL 33311', '{"lat":26.15,"lng":-80.21}', '{"type":"Polygon","coordinates":[[[-80.215,26.148],[-80.205,26.148],[-80.205,26.153],[-80.215,26.153],[-80.215,26.148]]]}'),
      (3, 2, 'Tampa Riverwalk Development', 'New construction progress tracking with weekly flyovers', '600 N Ashley Dr, Tampa, FL 33602', '{"lat":27.95,"lng":-82.46}', '{"type":"Polygon","coordinates":[[[-82.465,27.948],[-82.455,27.948],[-82.455,27.953],[-82.465,27.953],[-82.465,27.948]]]}'),
      (4, 1, 'Everglades Restoration Zone', 'Environmental survey for wetland restoration project', 'Everglades National Park, FL 34141', '{"lat":25.39,"lng":-80.59}', '{"type":"Polygon","coordinates":[[[-80.60,25.38],[-80.58,25.38],[-80.58,25.40],[-80.60,25.40],[-80.60,25.38]]]}'),
      (5, 2, 'Palm Beach Oceanfront', 'Coastal erosion monitoring and property survey', '100 Worth Ave, Palm Beach, FL 33480', '{"lat":26.70,"lng":-80.03}', NULL),
      (6, 1, 'Orlando Theme Park Survey', 'Aerial survey of theme park expansion area', '6000 Universal Blvd, Orlando, FL 32819', '{"lat":28.47,"lng":-81.47}', NULL)
    `);

    // ---- Jobs (raw SQL - skip generated columns client_id, client_type) ----
    console.log("Seeding Jobs...");
    await conn.query(`
      INSERT INTO \`Jobs\` (\`id\`, \`pipeline\`, \`createdBy\`, \`name\`, \`client\`, \`dates\`, \`siteId\`, \`products\`) VALUES
      (1, 'bids', 1, 'Miami Office Roof Survey Q1', '{"id":1,"type":"organization","name":"Coastal Development Group"}', '{"created":"2025-01-15T10:00:00.000Z"}', 1, '[{"id":5,"name":"Roof Inspection"},{"id":4,"name":"Custom Photography"}]'),
      (2, 'bids', 2, 'Sunrise HOA Spring Mapping', '{"id":2,"type":"organization","name":"Sunrise HOA Management"}', '{"created":"2025-01-20T14:00:00.000Z"}', 2, '[{"id":2,"name":"Community Viewer"}]'),
      (3, 'bids', 1, 'Everglades Wetland Assessment', '{"id":4,"type":"organization","name":"Everglades Environmental Services"}', '{"created":"2025-02-01T09:00:00.000Z"}', 4, '[{"id":7,"name":"Orthomosaic Map"},{"id":4,"name":"Custom Photography"}]'),
      (4, 'scheduled', 2, 'Tampa Riverwalk Progress - Feb', '{"id":3,"type":"organization","name":"Tampa Bay Construction LLC"}', '{"created":"2025-01-10T10:00:00.000Z","scheduled":"2025-02-20T09:00:00.000Z"}', 3, '[{"id":3,"name":"Construct Viewer"},{"id":6,"name":"Progress Video"}]'),
      (5, 'scheduled', 1, 'Palm Beach Coastal Survey', '{"id":5,"type":"organization","name":"Palm Beach Realty Corp"}', '{"created":"2025-01-18T11:00:00.000Z","scheduled":"2025-02-25T08:00:00.000Z"}', 5, '[{"id":1,"name":"Landscape Viewer"},{"id":7,"name":"Orthomosaic Map"}]'),
      (6, 'scheduled', 2, 'Orlando Expansion Flyover', '{"id":6,"type":"user","name":"Robert Thompson"}', '{"created":"2025-01-22T15:00:00.000Z","scheduled":"2025-03-01T10:00:00.000Z"}', 6, '[{"id":4,"name":"Custom Photography"}]'),
      (7, 'processing-deliver', 1, 'Miami Office Landscape View', '{"id":1,"type":"organization","name":"Coastal Development Group"}', '{"created":"2024-12-01T10:00:00.000Z","scheduled":"2024-12-15T09:00:00.000Z","flown":"2024-12-15T14:00:00.000Z","logged":"2024-12-15T16:00:00.000Z"}', 1, '[{"id":1,"name":"Landscape Viewer"}]'),
      (8, 'processing-deliver', 2, 'Sunrise HOA Winter Inspection', '{"id":2,"type":"organization","name":"Sunrise HOA Management"}', '{"created":"2024-12-05T10:00:00.000Z","scheduled":"2024-12-20T09:00:00.000Z","flown":"2024-12-20T11:00:00.000Z","logged":"2024-12-20T15:00:00.000Z"}', 2, '[{"id":2,"name":"Community Viewer"},{"id":5,"name":"Roof Inspection"}]'),
      (9, 'processing-deliver', 1, 'Tampa Riverwalk Progress - Jan', '{"id":3,"type":"organization","name":"Tampa Bay Construction LLC"}', '{"created":"2024-12-10T10:00:00.000Z","scheduled":"2025-01-05T09:00:00.000Z","flown":"2025-01-05T13:00:00.000Z","logged":"2025-01-05T17:00:00.000Z"}', 3, '[{"id":3,"name":"Construct Viewer"},{"id":6,"name":"Progress Video"}]'),
      (10, 'processing-deliver', 2, 'Everglades Baseline Survey', '{"id":4,"type":"organization","name":"Everglades Environmental Services"}', '{"created":"2024-11-15T10:00:00.000Z","scheduled":"2024-12-01T08:00:00.000Z","flown":"2024-12-01T12:00:00.000Z","logged":"2024-12-01T16:00:00.000Z"}', 4, '[{"id":7,"name":"Orthomosaic Map"},{"id":8,"name":"3D Model"}]'),
      (11, 'bill', 1, 'Palm Beach Property Survey Nov', '{"id":5,"type":"organization","name":"Palm Beach Realty Corp"}', '{"created":"2024-10-15T10:00:00.000Z","scheduled":"2024-11-01T09:00:00.000Z","flown":"2024-11-01T13:00:00.000Z","logged":"2024-11-01T16:00:00.000Z","delivered":"2024-11-10T10:00:00.000Z"}', 5, '[{"id":1,"name":"Landscape Viewer"},{"id":4,"name":"Custom Photography"}]'),
      (12, 'bill', 2, 'Sunrise HOA Fall Mapping', '{"id":2,"type":"organization","name":"Sunrise HOA Management"}', '{"created":"2024-10-01T10:00:00.000Z","scheduled":"2024-10-20T09:00:00.000Z","flown":"2024-10-20T12:00:00.000Z","logged":"2024-10-20T15:00:00.000Z","delivered":"2024-11-01T10:00:00.000Z"}', 2, '[{"id":2,"name":"Community Viewer"}]'),
      (13, 'bill', 1, 'Orlando Site Pre-Survey', '{"id":6,"type":"user","name":"Robert Thompson"}', '{"created":"2024-09-15T10:00:00.000Z","scheduled":"2024-10-01T09:00:00.000Z","flown":"2024-10-01T11:00:00.000Z","logged":"2024-10-01T14:00:00.000Z","delivered":"2024-10-15T10:00:00.000Z"}', 6, '[{"id":4,"name":"Custom Photography"},{"id":7,"name":"Orthomosaic Map"}]'),
      (14, 'completed', 1, 'Tampa Riverwalk Progress - Dec', '{"id":3,"type":"organization","name":"Tampa Bay Construction LLC"}', '{"created":"2024-08-15T10:00:00.000Z","scheduled":"2024-09-01T09:00:00.000Z","flown":"2024-09-01T13:00:00.000Z","logged":"2024-09-01T16:00:00.000Z","delivered":"2024-09-15T10:00:00.000Z","billed":"2024-10-01T10:00:00.000Z"}', 3, '[{"id":3,"name":"Construct Viewer"},{"id":6,"name":"Progress Video"}]'),
      (15, 'completed', 2, 'Miami Office Initial Survey', '{"id":1,"type":"organization","name":"Coastal Development Group"}', '{"created":"2024-07-01T10:00:00.000Z","scheduled":"2024-07-15T09:00:00.000Z","flown":"2024-07-15T14:00:00.000Z","logged":"2024-07-15T16:00:00.000Z","delivered":"2024-08-01T10:00:00.000Z","billed":"2024-08-15T10:00:00.000Z"}', 1, '[{"id":5,"name":"Roof Inspection"}]')
    `);

    // ---- Job_Meta ----
    console.log("Seeding Job_Meta...");
    const jobMetas: [number, string, string][] = [
      // Scheduled (4-6)
      [4, "approved_flight", "1"],
      [4, "scheduled_flight", "2025-02-20T09:00:00.000Z"],
      [4, "persons_assigned", "[3]"],
      [5, "approved_flight", "1"],
      [5, "scheduled_flight", "2025-02-25T08:00:00.000Z"],
      [5, "persons_assigned", "[4]"],
      [6, "approved_flight", "1"],
      [6, "scheduled_flight", "2025-03-01T10:00:00.000Z"],
      [6, "persons_assigned", "[3,4]"],
      // Processing-Deliver (7-10)
      [7, "approved_flight", "1"],
      [7, "scheduled_flight", "2024-12-15T09:00:00.000Z"],
      [7, "persons_assigned", "[3]"],
      [7, "flight_log", '{"duration":"1h 30m","altitude":"400ft","photos":180,"notes":"Clear skies, good conditions"}'],
      [8, "approved_flight", "1"],
      [8, "scheduled_flight", "2024-12-20T09:00:00.000Z"],
      [8, "persons_assigned", "[4]"],
      [8, "flight_log", '{"duration":"2h","altitude":"350ft","photos":245,"notes":"Light wind, excellent visibility"}'],
      [9, "approved_flight", "1"],
      [9, "scheduled_flight", "2025-01-05T09:00:00.000Z"],
      [9, "persons_assigned", "[3]"],
      [9, "flight_log", '{"duration":"1h 45m","altitude":"400ft","photos":210,"notes":"Construction progress on track"}'],
      [10, "approved_flight", "1"],
      [10, "scheduled_flight", "2024-12-01T08:00:00.000Z"],
      [10, "persons_assigned", "[4]"],
      [10, "flight_log", '{"duration":"3h","altitude":"300ft","photos":520,"notes":"Large area, multiple battery swaps"}'],
      // Bill (11-13)
      [11, "approved_flight", "1"],
      [11, "scheduled_flight", "2024-11-01T09:00:00.000Z"],
      [11, "persons_assigned", "[3]"],
      [11, "flight_log", '{"duration":"1h 15m","altitude":"400ft","photos":155,"notes":"Coastal winds manageable"}'],
      [11, "invoice_number", "INV-2024-011"],
      [12, "approved_flight", "1"],
      [12, "scheduled_flight", "2024-10-20T09:00:00.000Z"],
      [12, "persons_assigned", "[4]"],
      [12, "flight_log", '{"duration":"1h 30m","altitude":"350ft","photos":190,"notes":"Community mapping complete"}'],
      [12, "invoice_number", "INV-2024-012"],
      [13, "approved_flight", "1"],
      [13, "scheduled_flight", "2024-10-01T09:00:00.000Z"],
      [13, "persons_assigned", "[3,4]"],
      [13, "flight_log", '{"duration":"2h 15m","altitude":"400ft","photos":310,"notes":"Full site coverage"}'],
      [13, "invoice_number", "INV-2024-013"],
      // Completed (14-15)
      [14, "approved_flight", "1"],
      [14, "scheduled_flight", "2024-09-01T09:00:00.000Z"],
      [14, "persons_assigned", "[3]"],
      [14, "flight_log", '{"duration":"1h 45m","altitude":"400ft","photos":220,"notes":"Monthly progress report"}'],
      [14, "invoice_number", "INV-2024-014"],
      [14, "invoice_paid", "1"],
      [15, "approved_flight", "1"],
      [15, "scheduled_flight", "2024-07-15T09:00:00.000Z"],
      [15, "persons_assigned", "[4]"],
      [15, "flight_log", '{"duration":"1h","altitude":"400ft","photos":120,"notes":"Initial site assessment"}'],
      [15, "invoice_number", "INV-2024-015"],
      [15, "invoice_paid", "1"],
    ];
    for (const [jobId, key, val] of jobMetas) {
      await conn.query(
        "INSERT INTO `Job_Meta` (`job_id`, `meta_key`, `meta_value`) VALUES (?, ?, ?)",
        [jobId, key, val]
      );
    }

    // ---- Pages ----
    console.log("Seeding Pages...");
    const pagesSql = readFileSync(resolve(__dirname, "..", "docker", "init", "01-seed.sql"), "utf-8");
    // Extract all INSERT INTO `Pages` statements
    const pageInserts = pagesSql.match(/INSERT INTO `Pages`[\s\S]*?;/g);
    if (pageInserts) {
      for (const stmt of pageInserts) {
        await conn.query(stmt);
      }
    }

    // ---- Recurring ----
    console.log("Seeding Recurring_Job_Templates...");
    await conn.query(`
      INSERT INTO \`Recurring_Job_Templates\` (\`id\`, \`active\`, \`is_manual\`, \`name\`, \`site_id\`, \`client_type\`, \`client_id\`, \`rrule\`, \`timezone\`, \`dtstart\`, \`dtend\`, \`window_days\`, \`last_generated_through\`, \`amount_payable\`, \`notes\`, \`products\`, \`created_by\`) VALUES
      (1, 1, 0, 'Tampa Riverwalk Monthly Progress', 3, 'organization', 3, 'FREQ=MONTHLY;INTERVAL=1;BYDAY=1MO', 'America/New_York', '2025-01-06 09:00:00', '2025-06-30 09:00:00', 60, '2025-04-07 09:00:00', 2500.00, 'Monthly construction progress survey - first Monday of each month', '[{"id":3,"name":"Construct Viewer"},{"id":6,"name":"Progress Video"}]', 2)
    `);

    console.log("Seeding Recurring_Job_Occurrences...");
    await conn.query(`
      INSERT INTO \`Recurring_Job_Occurrences\` (\`id\`, \`template_id\`, \`occurrence_at\`, \`status\`, \`job_id\`) VALUES
      (1, 1, '2025-02-03 09:00:00', 'created', 9),
      (2, 1, '2025-03-03 09:00:00', 'planned', NULL),
      (3, 1, '2025-04-07 09:00:00', 'planned', NULL)
    `);

    await conn.query("SET FOREIGN_KEY_CHECKS = 1");

    // Count rows
    const tables = ["Users", "User_Meta", "Configuration", "Products", "Permissions", "Pages", "Organization", "Organization_Meta", "Sites", "Jobs", "Job_Meta", "Recurring_Job_Templates", "Recurring_Job_Occurrences"];
    let total = 0;
    console.log("\n--- Row counts ---");
    for (const t of tables) {
      const [rows] = await conn.query(`SELECT COUNT(*) as cnt FROM \`${t}\``);
      const cnt = (rows as Array<{ cnt: number }>)[0].cnt;
      total += cnt;
      console.log(`  ${t}: ${cnt}`);
    }
    console.log(`  TOTAL: ${total}`);

    console.log("\nSeed complete!");

  } finally {
    conn.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
