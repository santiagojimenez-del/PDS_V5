// Role IDs (from Configuration.roles)
export const ROLES = {
  ADMIN: 0,
  CLIENT: 1,
  REGISTERED: 3, // base "registered user" role - nearly all users have this
  DEVELOPER: 4,
  STAFF: 5,
  PILOT: 6,
  MANAGER: 7,
} as const;

// App role access (from Configuration role_access per app)
export const HUB_ROLES = [ROLES.ADMIN, ROLES.MANAGER, ROLES.STAFF, ROLES.PILOT];
export const CLIENT_ROLES = [ROLES.ADMIN, ROLES.CLIENT, ROLES.REGISTERED];
export const ADMIN_ROLES = [ROLES.ADMIN];

// Pipeline stages
export const PIPELINES = {
  BIDS: "bids",
  SCHEDULED: "scheduled",
  PROCESSING_DELIVER: "processing-deliver",
  BILL: "bill",
  COMPLETED: "completed",
} as const;

export const PIPELINE_ORDER = [
  PIPELINES.BIDS,
  PIPELINES.SCHEDULED,
  PIPELINES.PROCESSING_DELIVER,
  PIPELINES.BILL,
  PIPELINES.COMPLETED,
] as const;

// Token types
export const TOKEN_TYPES = {
  SESSION: "session",
  TWO_FACTOR_SESSION: "two-factor-session",
  VERIFICATION: "verification",
  REGISTER: "register",
  PASS_RESET: "pass-reset",
} as const;

// Token expiry durations (in seconds)
export const TOKEN_EXPIRY = {
  SESSION: 30 * 24 * 60 * 60, // 30 days
  TWO_FACTOR_SESSION: 15 * 24 * 60 * 60, // 15 days
  VERIFICATION: 5 * 60, // 5 minutes
  REGISTER: 4 * 24 * 60 * 60, // 4 days
  PASS_RESET: 24 * 60 * 60, // 1 day
} as const;

// Application names for Configuration table
export const APPS = {
  GLOBAL: "*",
  HUB: "hub",
  CLIENT: "client",
  ADMIN: "admin",
} as const;

export type AppName = (typeof APPS)[keyof typeof APPS];
export type Pipeline = (typeof PIPELINES)[keyof typeof PIPELINES];
export type RoleId = (typeof ROLES)[keyof typeof ROLES];
export type TokenType = (typeof TOKEN_TYPES)[keyof typeof TOKEN_TYPES];

// Viewer product IDs
export const VIEWER_PRODUCTS = {
  LANDSCAPE: 1,
  COMMUNITY: 2,
  CONSTRUCT: 3,
} as const;

// Cache TTLs (in milliseconds)
export const CACHE_TTL = {
  CONFIGURATION: 6 * 60 * 60 * 1000, // 6 hours
  PERMISSIONS: 10 * 60 * 1000, // 10 minutes
  USER_SESSIONS: 5 * 60 * 1000, // 5 minutes
  COLUMN_METADATA: 60 * 60 * 1000, // 1 hour
} as const;
