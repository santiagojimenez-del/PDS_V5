-- ProDrones Hub - Clean Development Seed
-- 10 test users, 5 orgs, 6 sites, 15 jobs, products, permissions, pages, config, recurring
-- All passwords: Test1234!  (bcrypt cost 11)

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================
-- USERS (10)
-- ============================================================
TRUNCATE TABLE `Users`;
INSERT INTO `Users` (`ID`, `Email`, `Password`, `Tokens`) VALUES
(1,  'admin@prodrones.com',      '$2b$11$JJjE4zuhalnipgHMv5VWjegpplogO6RXCgI90i1srPNvkngyhBcvO', '[]'),
(2,  'manager@prodrones.com',    '$2b$11$JJjE4zuhalnipgHMv5VWjegpplogO6RXCgI90i1srPNvkngyhBcvO', '[]'),
(3,  'pilot1@prodrones.com',     '$2b$11$JJjE4zuhalnipgHMv5VWjegpplogO6RXCgI90i1srPNvkngyhBcvO', '[]'),
(4,  'pilot2@prodrones.com',     '$2b$11$JJjE4zuhalnipgHMv5VWjegpplogO6RXCgI90i1srPNvkngyhBcvO', '[]'),
(5,  'staff@prodrones.com',      '$2b$11$JJjE4zuhalnipgHMv5VWjegpplogO6RXCgI90i1srPNvkngyhBcvO', '[]'),
(6,  'client1@prodrones.com',    '$2b$11$JJjE4zuhalnipgHMv5VWjegpplogO6RXCgI90i1srPNvkngyhBcvO', '[]'),
(7,  'client2@prodrones.com',    '$2b$11$JJjE4zuhalnipgHMv5VWjegpplogO6RXCgI90i1srPNvkngyhBcvO', '[]'),
(8,  'developer@prodrones.com',  '$2b$11$JJjE4zuhalnipgHMv5VWjegpplogO6RXCgI90i1srPNvkngyhBcvO', '[]'),
(9,  'registered@prodrones.com', '$2b$11$JJjE4zuhalnipgHMv5VWjegpplogO6RXCgI90i1srPNvkngyhBcvO', '[]'),
(10, 'multi@prodrones.com',      '$2b$11$JJjE4zuhalnipgHMv5VWjegpplogO6RXCgI90i1srPNvkngyhBcvO', '[]');

-- ============================================================
-- USER_META
-- ============================================================
TRUNCATE TABLE `User_Meta`;
INSERT INTO `User_Meta` (`uid`, `meta_key`, `meta_value`) VALUES
-- User 1: Admin
(1, 'first_name', 'Andres'),
(1, 'last_name', 'Salamanca'),
(1, 'roles', '[0]'),
(1, 'permissions', '[]'),
-- User 2: Manager
(2, 'first_name', 'Carlos'),
(2, 'last_name', 'Rivera'),
(2, 'roles', '[7]'),
(2, 'permissions', '[]'),
-- User 3: Pilot 1
(3, 'first_name', 'Marco'),
(3, 'last_name', 'Diaz'),
(3, 'roles', '[6]'),
(3, 'permissions', '[]'),
-- User 4: Pilot 2
(4, 'first_name', 'Sofia'),
(4, 'last_name', 'Chen'),
(4, 'roles', '[6]'),
(4, 'permissions', '[]'),
-- User 5: Staff
(5, 'first_name', 'James'),
(5, 'last_name', 'Mitchell'),
(5, 'roles', '[5]'),
(5, 'permissions', '[]'),
-- User 6: Client 1
(6, 'first_name', 'Robert'),
(6, 'last_name', 'Thompson'),
(6, 'roles', '[1]'),
(6, 'permissions', '[]'),
-- User 7: Client 2
(7, 'first_name', 'Maria'),
(7, 'last_name', 'Gonzalez'),
(7, 'roles', '[1]'),
(7, 'permissions', '[]'),
-- User 8: Developer
(8, 'first_name', 'Alex'),
(8, 'last_name', 'Park'),
(8, 'roles', '[4]'),
(8, 'permissions', '[]'),
-- User 9: Registered
(9, 'first_name', 'David'),
(9, 'last_name', 'Brown'),
(9, 'roles', '[3]'),
(9, 'permissions', '[]'),
-- User 10: Multi-role (Staff + Manager)
(10, 'first_name', 'Nicole'),
(10, 'last_name', 'Vasquez'),
(10, 'roles', '[5,7]'),
(10, 'permissions', '[]');

-- ============================================================
-- CONFIGURATION  (BUG FIX: globals use '*' not '')
-- ============================================================
TRUNCATE TABLE `Configuration`;
INSERT INTO `Configuration` (`Application`, `Name`, `Value`) VALUES
-- Global settings (Application = '*')
('*', 'api_server', '/api'),
('*', 'login_form', 'login'),
('*', 'session_name', 'pds_session'),
('*', 'request_token_var', 'request'),
('*', 'share_token_var', 'share'),
('*', 'primary_app', 'hub'),
('*', 'mail_email', 'office@prodrones.com'),
('*', 'mail_name', 'PDS'),
('*', 'maintenance', '{"enabled":false,"whitelist":[1],"message":"System is under maintenance."}'),
('*', 'roles', '[{"id":0,"name":"Admin","app":"hub","default":false,"superadmin":true,"authentication":true,"permissions":[]},{"id":1,"name":"Client","app":"client","default":false,"superadmin":false,"authentication":false,"permissions":[]},{"id":3,"name":"Registered","app":"hub","default":false,"superadmin":false,"authentication":false,"permissions":[]},{"id":4,"name":"Developer","app":"hub","default":false,"superadmin":false,"authentication":false,"permissions":[]},{"id":5,"name":"Staff","app":"hub","default":true,"superadmin":false,"authentication":false,"permissions":[]},{"id":6,"name":"Pilot","app":"hub","default":false,"superadmin":false,"authentication":false,"permissions":[]},{"id":7,"name":"Manager","app":"hub","default":false,"superadmin":false,"authentication":false,"permissions":[]}]'),
('*', 'pipes', '[{"id":"bids","name":"Bids","color":"#6366f1"},{"id":"scheduled","name":"Scheduled","color":"#f59e0b"},{"id":"processing-deliver","name":"Processing / Deliver","color":"#3b82f6"},{"id":"bill","name":"Bill","color":"#10b981"},{"id":"completed","name":"Completed","color":"#6b7280"}]'),
-- Hub app
('hub', 'domain', 'hub.prodrones.com'),
('hub', 'role_access', '[0, 7, 5, 6]'),
('hub', 'site_title', 'ProDrones Hub'),
('hub', 'site_logo', '/img/logo/PDSLogo1-ud02.2022.png'),
('hub', 'site_logo_sm', '/img/logo/PDSLogo-sm.png'),
('hub', 'cdn_server', 'http://localhost:3005'),
('hub', 'socket_server', 'http://localhost:3005'),
-- Client app
('client', 'domain', 'client.prodrones.com'),
('client', 'client_role', '1'),
('client', 'site_title', 'ProDrones Client Portal'),
('client', 'role_access', '[1]'),
-- Admin app
('admin', 'domain', 'admin.prodrones.com'),
('admin', 'site_title', 'ProDrones Admin'),
('admin', 'role_access', '[0]');

-- ============================================================
-- PRODUCTS (8)
-- ============================================================
TRUNCATE TABLE `Products`;
INSERT INTO `Products` (`id`, `name`, `deliverable_template`, `meta_defaults`, `configuration`) VALUES
(1, 'Landscape Viewer', 'landscape_viewer', '[]', '{}'),
(2, 'Community Viewer', 'community_viewer', '[]', '{}'),
(3, 'Construct Viewer', 'construct_viewer', '[]', '{}'),
(4, 'Custom Photography', NULL, '[]', NULL),
(5, 'Roof Inspection', NULL, '[]', NULL),
(6, 'Progress Video', NULL, '[]', NULL),
(7, 'Orthomosaic Map', NULL, '[]', NULL),
(8, '3D Model', NULL, '[]', NULL);

-- ============================================================
-- PERMISSIONS (11)
-- ============================================================
TRUNCATE TABLE `Permissions`;
INSERT INTO `Permissions` (`name`, `category`, `label`, `description`, `priority`, `hidden`, `enforce`) VALUES
('create_project_site', 'Project Management', 'Create Site', 'Can create new project sites', 1, 0, 1),
('create_tileset', 'Tileset Management', 'Create Tileset', 'Can create and upload tilesets', 2, 0, 1),
('delete_tileset', 'Tileset Management', 'Delete Tileset', 'Can delete tilesets', 2, 0, 1),
('onboard_company', 'Company Management', 'Onboard Company', 'Can create new companies', 3, 0, 1),
('manage_company', 'Company Management', 'Manage Company', 'Can manage existing companies', 3, 0, 1),
('view_all_jobs', 'Job Management', 'View All Jobs', 'Can view all jobs regardless of assignment', 1, 0, 1),
('view_roles_and_permissions', 'Roles & Permissions', 'View Roles', 'Can view roles and permissions page', 5, 0, 1),
('manage_roles_and_permissions', 'Roles & Permissions', 'Manage Roles', 'Can modify roles and permissions', 5, 0, 1),
('developer_tools', 'General', 'Developer Tools', 'Access to developer tools', 6, 0, 1),
('bulk_approve', 'Job Management', 'Bulk Approve', 'Can bulk approve bids', 1, 0, 1),
('bulk_deliver', 'Job Management', 'Bulk Deliver', 'Can bulk deliver jobs', 1, 0, 1);

-- ============================================================
-- PAGES (23)
-- ============================================================
TRUNCATE TABLE `Pages`;

-- Hub pages (10)
INSERT INTO `Pages` (`Application`, `Page`, `Wrapper`, `Template`, `Priority`, `Hidden`, `Shareable`, `RoleAccess`, `PermissionAccess`, `Design`, `NavGroup`) VALUES
('hub', '', 'standard', NULL, 1, 0, 0, NULL, NULL, '{"icon":"<i class=\\"ti ti-home\\"></i>","title":"Home"}', NULL),
('hub', 'workflow/jobs', 'standard', NULL, 2, 0, 0, NULL, NULL, '{"icon":"<i class=\\"ti ti-briefcase\\"></i>","title":"Job Dashboard"}', '{"group":"Workflow"}'),
('hub', 'workflow/jobs/new', 'standard', NULL, 3, 1, 0, NULL, NULL, '{"icon":"<i class=\\"ti ti-plus\\"></i>","title":"New Job"}', '{"group":"Workflow"}'),
('hub', 'workflow/recurring', 'standard', NULL, 4, 0, 0, NULL, NULL, '{"icon":"<i class=\\"ti ti-repeat\\"></i>","title":"Recurring Jobs"}', '{"group":"Workflow"}'),
('hub', 'workflow/sites', 'standard', NULL, 5, 0, 0, NULL, '["create_project_site"]', '{"icon":"<i class=\\"ti ti-map-pin\\"></i>","title":"Manage Sites"}', '{"group":"Workflow"}'),
('hub', 'tilesets', 'standard', NULL, 6, 0, 0, NULL, '["create_tileset"]', '{"icon":"<i class=\\"ti ti-layers-intersect\\"></i>","title":"View All Tilesets"}', '{"group":"Mapping & Layers","dropdown":{"icon":"<i class=\\"ti ti-map\\"></i>","title":"Tilesets"}}'),
('hub', 'tilesets/manage', 'standard', NULL, 7, 1, 0, NULL, '["create_tileset"]', '{"icon":"<i class=\\"ti ti-upload\\"></i>","title":"Create Tileset"}', '{"group":"Mapping & Layers","dropdown":{"icon":"<i class=\\"ti ti-map\\"></i>","title":"Tilesets"}}'),
('hub', 'onboard/contact', 'standard', NULL, 8, 0, 0, NULL, NULL, '{"icon":"<i class=\\"ti ti-user-plus\\"></i>","title":"Add Contact"}', '{"group":"Onboarding","dropdown":{"icon":"<i class=\\"ti ti-user-plus\\"></i>","title":"Contact"}}'),
('hub', 'onboard/company', 'standard', NULL, 9, 0, 0, NULL, '["onboard_company"]', '{"icon":"<i class=\\"ti ti-building\\"></i>","title":"Add Company"}', '{"group":"Onboarding","dropdown":{"icon":"<i class=\\"ti ti-building\\"></i>","title":"Company"}}'),
('hub', 'onboard/company/manage', 'standard', NULL, 10, 0, 0, NULL, '["manage_company"]', '{"icon":"<i class=\\"ti ti-settings\\"></i>","title":"Manage Companies"}', '{"group":"Onboarding","dropdown":{"icon":"<i class=\\"ti ti-building\\"></i>","title":"Company"}}');

-- Hub: Manage Contacts page
INSERT INTO `Pages` (`Application`, `Page`, `Wrapper`, `Template`, `Priority`, `Hidden`, `Shareable`, `RoleAccess`, `PermissionAccess`, `Design`, `NavGroup`) VALUES
('hub', 'onboard/contact/manage', 'standard', NULL, 11, 0, 0, NULL, '["manage_company"]', '{"icon":"<i class=\\"ti ti-address-book\\"></i>","title":"Manage Contacts"}', '{"group":"Onboarding","dropdown":{"icon":"<i class=\\"ti ti-user-plus\\"></i>","title":"Contact"}}');

-- Client pages (5)
INSERT INTO `Pages` (`Application`, `Page`, `Wrapper`, `Template`, `Priority`, `Hidden`, `Shareable`, `RoleAccess`, `PermissionAccess`, `Design`, `NavGroup`) VALUES
('client', '', 'standard', NULL, 1, 0, 0, NULL, NULL, '{"icon":"<i class=\\"ti ti-home\\"></i>","title":"Home"}', NULL),
('client', 'sites', 'standard', NULL, 2, 0, 0, NULL, NULL, '{"icon":"<i class=\\"ti ti-map\\"></i>","title":"Project List"}', '{"group":"Projects"}'),
('client', 'site', 'standard', NULL, 3, 1, 0, NULL, NULL, '{"icon":"<i class=\\"ti ti-map-pin\\"></i>","title":"Site Details"}', '{"group":"Projects"}'),
('client', 'job', 'standard', NULL, 4, 1, 0, NULL, '["view_all_jobs"]', '{"icon":"<i class=\\"ti ti-briefcase\\"></i>","title":"View Project"}', '{"group":"Projects"}'),
('client', 'job/product', 'standard', NULL, 5, 1, 1, NULL, '["view_all_jobs"]', '{"icon":"<i class=\\"ti ti-package\\"></i>","title":"View Product"}', NULL);

-- Admin pages (5)
INSERT INTO `Pages` (`Application`, `Page`, `Wrapper`, `Template`, `Priority`, `Hidden`, `Shareable`, `RoleAccess`, `PermissionAccess`, `Design`, `NavGroup`) VALUES
('admin', '', 'standard', NULL, 1, 0, 0, NULL, NULL, '{"icon":"<i class=\\"ti ti-dashboard\\"></i>","title":"Dashboard"}', NULL),
('admin', 'users/search', 'standard', NULL, 2, 0, 0, NULL, NULL, '{"icon":"<i class=\\"ti ti-search\\"></i>","title":"User Search"}', '{"group":"Users"}'),
('admin', 'users/view', 'standard', NULL, 3, 1, 0, NULL, NULL, '{"icon":"<i class=\\"ti ti-user\\"></i>","title":"View User"}', '{"group":"Users"}'),
('admin', 'users/roles', 'standard', NULL, 4, 0, 0, NULL, '["view_roles_and_permissions"]', '{"icon":"<i class=\\"ti ti-shield\\"></i>","title":"Roles & Permissions"}', '{"group":"Users"}'),
('admin', 'developer/active-visitors', 'standard', NULL, 5, 0, 0, NULL, '["developer_tools"]', '{"icon":"<i class=\\"ti ti-activity\\"></i>","title":"Active Connections"}', '{"group":"Developer Tools"}');

-- Auth / Global pages (2) - RoleAccess '["*"]' means public
INSERT INTO `Pages` (`Application`, `Page`, `Wrapper`, `Template`, `Priority`, `Hidden`, `Shareable`, `RoleAccess`, `PermissionAccess`, `Design`, `NavGroup`) VALUES
('*', 'login', 'blank', 'login', 1, 0, 0, '["*"]', NULL, '{"icon":"","title":"Login"}', NULL),
('*', 'register', 'blank', 'register', 2, 0, 0, '["*"]', NULL, '{"icon":"","title":"Register"}', NULL);

-- ============================================================
-- ORGANIZATIONS (5)
-- ============================================================
TRUNCATE TABLE `Organization`;
INSERT INTO `Organization` (`id`, `name`) VALUES
(1, 'Coastal Development Group'),
(2, 'Sunrise HOA Management'),
(3, 'Tampa Bay Construction LLC'),
(4, 'Everglades Environmental Services'),
(5, 'Palm Beach Realty Corp');

-- ============================================================
-- ORGANIZATION_META  (BUG FIX: contacts are flat arrays)
-- ============================================================
TRUNCATE TABLE `Organization_Meta`;
INSERT INTO `Organization_Meta` (`org_id`, `meta_key`, `meta_value`) VALUES
-- Org 1: Coastal Development Group
(1, 'contacts', '[6]'),
(1, 'StreetAddress', '200 Biscayne Blvd'),
(1, 'City', 'Miami'),
(1, 'State', 'FL'),
(1, 'ZipCode', '33131'),
-- Org 2: Sunrise HOA Management
(2, 'contacts', '[6]'),
(2, 'StreetAddress', '1500 E Sunrise Blvd'),
(2, 'City', 'Fort Lauderdale'),
(2, 'State', 'FL'),
(2, 'ZipCode', '33304'),
-- Org 3: Tampa Bay Construction LLC
(3, 'contacts', '[7]'),
(3, 'StreetAddress', '400 N Tampa St'),
(3, 'City', 'Tampa'),
(3, 'State', 'FL'),
(3, 'ZipCode', '33602'),
-- Org 4: Everglades Environmental Services
(4, 'contacts', '[7]'),
(4, 'StreetAddress', '900 5th Ave S'),
(4, 'City', 'Naples'),
(4, 'State', 'FL'),
(4, 'ZipCode', '34102'),
-- Org 5: Palm Beach Realty Corp
(5, 'contacts', '[6,7]'),
(5, 'StreetAddress', '777 S Flagler Dr'),
(5, 'City', 'West Palm Beach'),
(5, 'State', 'FL'),
(5, 'ZipCode', '33401');

-- ============================================================
-- SITES (6) - Real Florida coordinates
-- ============================================================
TRUNCATE TABLE `Sites`;
INSERT INTO `Sites` (`id`, `createdBy`, `name`, `description`, `address`, `coordinates`, `boundary`) VALUES
(1, 1, 'Downtown Miami Office Complex',
   'Multi-story office building aerial survey and roof inspection',
   '200 S Biscayne Blvd, Miami, FL 33131',
   '{"lat":25.77,"lng":-80.19}',
   NULL),
(2, 2, 'Sunrise Lakes HOA',
   'Residential community aerial mapping for HOA property assessment',
   '2800 W Sunrise Blvd, Fort Lauderdale, FL 33311',
   '{"lat":26.15,"lng":-80.21}',
   '{"type":"Polygon","coordinates":[[[-80.215,26.148],[-80.205,26.148],[-80.205,26.153],[-80.215,26.153],[-80.215,26.148]]]}'),
(3, 2, 'Tampa Riverwalk Development',
   'New construction progress tracking with weekly flyovers',
   '600 N Ashley Dr, Tampa, FL 33602',
   '{"lat":27.95,"lng":-82.46}',
   '{"type":"Polygon","coordinates":[[[-82.465,27.948],[-82.455,27.948],[-82.455,27.953],[-82.465,27.953],[-82.465,27.948]]]}'),
(4, 1, 'Everglades Restoration Zone',
   'Environmental survey for wetland restoration project',
   'Everglades National Park, FL 34141',
   '{"lat":25.39,"lng":-80.59}',
   '{"type":"Polygon","coordinates":[[[-80.60,25.38],[-80.58,25.38],[-80.58,25.40],[-80.60,25.40],[-80.60,25.38]]]}'),
(5, 2, 'Palm Beach Oceanfront',
   'Coastal erosion monitoring and property survey',
   '100 Worth Ave, Palm Beach, FL 33480',
   '{"lat":26.70,"lng":-80.03}',
   NULL),
(6, 1, 'Orlando Theme Park Survey',
   'Aerial survey of theme park expansion area',
   '6000 Universal Blvd, Orlando, FL 32819',
   '{"lat":28.47,"lng":-81.47}',
   NULL);

-- ============================================================
-- JOBS (15) - Distributed across pipeline stages
-- Note: Do NOT include client_id/client_type (generated columns)
-- ============================================================
TRUNCATE TABLE `Jobs`;

-- BIDS (3): Jobs 1-3
INSERT INTO `Jobs` (`id`, `pipeline`, `createdBy`, `name`, `client`, `dates`, `siteId`, `products`) VALUES
(1, 'bids', 1, 'Miami Office Roof Survey Q1',
   '{"id":1,"type":"organization","name":"Coastal Development Group"}',
   '{"created":"2025-01-15T10:00:00.000Z"}',
   1,
   '[{"id":5,"name":"Roof Inspection"},{"id":4,"name":"Custom Photography"}]'),
(2, 'bids', 2, 'Sunrise HOA Spring Mapping',
   '{"id":2,"type":"organization","name":"Sunrise HOA Management"}',
   '{"created":"2025-01-20T14:00:00.000Z"}',
   2,
   '[{"id":2,"name":"Community Viewer"}]'),
(3, 'bids', 1, 'Everglades Wetland Assessment',
   '{"id":4,"type":"organization","name":"Everglades Environmental Services"}',
   '{"created":"2025-02-01T09:00:00.000Z"}',
   4,
   '[{"id":7,"name":"Orthomosaic Map"},{"id":4,"name":"Custom Photography"}]');

-- SCHEDULED (3): Jobs 4-6
INSERT INTO `Jobs` (`id`, `pipeline`, `createdBy`, `name`, `client`, `dates`, `siteId`, `products`) VALUES
(4, 'scheduled', 2, 'Tampa Riverwalk Progress - Feb',
   '{"id":3,"type":"organization","name":"Tampa Bay Construction LLC"}',
   '{"created":"2025-01-10T10:00:00.000Z","scheduled":"2025-02-20T09:00:00.000Z"}',
   3,
   '[{"id":3,"name":"Construct Viewer"},{"id":6,"name":"Progress Video"}]'),
(5, 'scheduled', 1, 'Palm Beach Coastal Survey',
   '{"id":5,"type":"organization","name":"Palm Beach Realty Corp"}',
   '{"created":"2025-01-18T11:00:00.000Z","scheduled":"2025-02-25T08:00:00.000Z"}',
   5,
   '[{"id":1,"name":"Landscape Viewer"},{"id":7,"name":"Orthomosaic Map"}]'),
(6, 'scheduled', 2, 'Orlando Expansion Flyover',
   '{"id":6,"type":"user","name":"Robert Thompson"}',
   '{"created":"2025-01-22T15:00:00.000Z","scheduled":"2025-03-01T10:00:00.000Z"}',
   6,
   '[{"id":4,"name":"Custom Photography"}]');

-- PROCESSING-DELIVER (4): Jobs 7-10
INSERT INTO `Jobs` (`id`, `pipeline`, `createdBy`, `name`, `client`, `dates`, `siteId`, `products`) VALUES
(7, 'processing-deliver', 1, 'Miami Office Landscape View',
   '{"id":1,"type":"organization","name":"Coastal Development Group"}',
   '{"created":"2024-12-01T10:00:00.000Z","scheduled":"2024-12-15T09:00:00.000Z","flown":"2024-12-15T14:00:00.000Z","logged":"2024-12-15T16:00:00.000Z"}',
   1,
   '[{"id":1,"name":"Landscape Viewer"}]'),
(8, 'processing-deliver', 2, 'Sunrise HOA Winter Inspection',
   '{"id":2,"type":"organization","name":"Sunrise HOA Management"}',
   '{"created":"2024-12-05T10:00:00.000Z","scheduled":"2024-12-20T09:00:00.000Z","flown":"2024-12-20T11:00:00.000Z","logged":"2024-12-20T15:00:00.000Z"}',
   2,
   '[{"id":2,"name":"Community Viewer"},{"id":5,"name":"Roof Inspection"}]'),
(9, 'processing-deliver', 1, 'Tampa Riverwalk Progress - Jan',
   '{"id":3,"type":"organization","name":"Tampa Bay Construction LLC"}',
   '{"created":"2024-12-10T10:00:00.000Z","scheduled":"2025-01-05T09:00:00.000Z","flown":"2025-01-05T13:00:00.000Z","logged":"2025-01-05T17:00:00.000Z"}',
   3,
   '[{"id":3,"name":"Construct Viewer"},{"id":6,"name":"Progress Video"}]'),
(10, 'processing-deliver', 2, 'Everglades Baseline Survey',
   '{"id":4,"type":"organization","name":"Everglades Environmental Services"}',
   '{"created":"2024-11-15T10:00:00.000Z","scheduled":"2024-12-01T08:00:00.000Z","flown":"2024-12-01T12:00:00.000Z","logged":"2024-12-01T16:00:00.000Z"}',
   4,
   '[{"id":7,"name":"Orthomosaic Map"},{"id":8,"name":"3D Model"}]');

-- BILL (3): Jobs 11-13
INSERT INTO `Jobs` (`id`, `pipeline`, `createdBy`, `name`, `client`, `dates`, `siteId`, `products`) VALUES
(11, 'bill', 1, 'Palm Beach Property Survey Nov',
   '{"id":5,"type":"organization","name":"Palm Beach Realty Corp"}',
   '{"created":"2024-10-15T10:00:00.000Z","scheduled":"2024-11-01T09:00:00.000Z","flown":"2024-11-01T13:00:00.000Z","logged":"2024-11-01T16:00:00.000Z","delivered":"2024-11-10T10:00:00.000Z"}',
   5,
   '[{"id":1,"name":"Landscape Viewer"},{"id":4,"name":"Custom Photography"}]'),
(12, 'bill', 2, 'Sunrise HOA Fall Mapping',
   '{"id":2,"type":"organization","name":"Sunrise HOA Management"}',
   '{"created":"2024-10-01T10:00:00.000Z","scheduled":"2024-10-20T09:00:00.000Z","flown":"2024-10-20T12:00:00.000Z","logged":"2024-10-20T15:00:00.000Z","delivered":"2024-11-01T10:00:00.000Z"}',
   2,
   '[{"id":2,"name":"Community Viewer"}]'),
(13, 'bill', 1, 'Orlando Site Pre-Survey',
   '{"id":6,"type":"user","name":"Robert Thompson"}',
   '{"created":"2024-09-15T10:00:00.000Z","scheduled":"2024-10-01T09:00:00.000Z","flown":"2024-10-01T11:00:00.000Z","logged":"2024-10-01T14:00:00.000Z","delivered":"2024-10-15T10:00:00.000Z"}',
   6,
   '[{"id":4,"name":"Custom Photography"},{"id":7,"name":"Orthomosaic Map"}]');

-- COMPLETED (2): Jobs 14-15
INSERT INTO `Jobs` (`id`, `pipeline`, `createdBy`, `name`, `client`, `dates`, `siteId`, `products`) VALUES
(14, 'completed', 1, 'Tampa Riverwalk Progress - Dec',
   '{"id":3,"type":"organization","name":"Tampa Bay Construction LLC"}',
   '{"created":"2024-08-15T10:00:00.000Z","scheduled":"2024-09-01T09:00:00.000Z","flown":"2024-09-01T13:00:00.000Z","logged":"2024-09-01T16:00:00.000Z","delivered":"2024-09-15T10:00:00.000Z","billed":"2024-10-01T10:00:00.000Z"}',
   3,
   '[{"id":3,"name":"Construct Viewer"},{"id":6,"name":"Progress Video"}]'),
(15, 'completed', 2, 'Miami Office Initial Survey',
   '{"id":1,"type":"organization","name":"Coastal Development Group"}',
   '{"created":"2024-07-01T10:00:00.000Z","scheduled":"2024-07-15T09:00:00.000Z","flown":"2024-07-15T14:00:00.000Z","logged":"2024-07-15T16:00:00.000Z","delivered":"2024-08-01T10:00:00.000Z","billed":"2024-08-15T10:00:00.000Z"}',
   1,
   '[{"id":5,"name":"Roof Inspection"}]');

-- ============================================================
-- JOB_META
-- ============================================================
TRUNCATE TABLE `Job_Meta`;
INSERT INTO `Job_Meta` (`job_id`, `meta_key`, `meta_value`) VALUES
-- Scheduled jobs (4-6): need approved_flight, scheduled_flight, persons_assigned
(4, 'approved_flight', '1'),
(4, 'scheduled_flight', '2025-02-20T09:00:00.000Z'),
(4, 'persons_assigned', '[3]'),
(5, 'approved_flight', '1'),
(5, 'scheduled_flight', '2025-02-25T08:00:00.000Z'),
(5, 'persons_assigned', '[4]'),
(6, 'approved_flight', '1'),
(6, 'scheduled_flight', '2025-03-01T10:00:00.000Z'),
(6, 'persons_assigned', '[3,4]'),
-- Processing-Deliver jobs (7-10): need all above + flight_log
(7, 'approved_flight', '1'),
(7, 'scheduled_flight', '2024-12-15T09:00:00.000Z'),
(7, 'persons_assigned', '[3]'),
(7, 'flight_log', '{"duration":"1h 30m","altitude":"400ft","photos":180,"notes":"Clear skies, good conditions"}'),
(8, 'approved_flight', '1'),
(8, 'scheduled_flight', '2024-12-20T09:00:00.000Z'),
(8, 'persons_assigned', '[4]'),
(8, 'flight_log', '{"duration":"2h","altitude":"350ft","photos":245,"notes":"Light wind, excellent visibility"}'),
(9, 'approved_flight', '1'),
(9, 'scheduled_flight', '2025-01-05T09:00:00.000Z'),
(9, 'persons_assigned', '[3]'),
(9, 'flight_log', '{"duration":"1h 45m","altitude":"400ft","photos":210,"notes":"Construction progress on track"}'),
(10, 'approved_flight', '1'),
(10, 'scheduled_flight', '2024-12-01T08:00:00.000Z'),
(10, 'persons_assigned', '[4]'),
(10, 'flight_log', '{"duration":"3h","altitude":"300ft","photos":520,"notes":"Large area, multiple battery swaps"}'),
-- Bill jobs (11-13): need all above + invoice_number
(11, 'approved_flight', '1'),
(11, 'scheduled_flight', '2024-11-01T09:00:00.000Z'),
(11, 'persons_assigned', '[3]'),
(11, 'flight_log', '{"duration":"1h 15m","altitude":"400ft","photos":155,"notes":"Coastal winds manageable"}'),
(11, 'invoice_number', 'INV-2024-011'),
(12, 'approved_flight', '1'),
(12, 'scheduled_flight', '2024-10-20T09:00:00.000Z'),
(12, 'persons_assigned', '[4]'),
(12, 'flight_log', '{"duration":"1h 30m","altitude":"350ft","photos":190,"notes":"Community mapping complete"}'),
(12, 'invoice_number', 'INV-2024-012'),
(13, 'approved_flight', '1'),
(13, 'scheduled_flight', '2024-10-01T09:00:00.000Z'),
(13, 'persons_assigned', '[3,4]'),
(13, 'flight_log', '{"duration":"2h 15m","altitude":"400ft","photos":310,"notes":"Full site coverage"}'),
(13, 'invoice_number', 'INV-2024-013'),
-- Completed jobs (14-15): need all above + invoice_paid
(14, 'approved_flight', '1'),
(14, 'scheduled_flight', '2024-09-01T09:00:00.000Z'),
(14, 'persons_assigned', '[3]'),
(14, 'flight_log', '{"duration":"1h 45m","altitude":"400ft","photos":220,"notes":"Monthly progress report"}'),
(14, 'invoice_number', 'INV-2024-014'),
(14, 'invoice_paid', '1'),
(15, 'approved_flight', '1'),
(15, 'scheduled_flight', '2024-07-15T09:00:00.000Z'),
(15, 'persons_assigned', '[4]'),
(15, 'flight_log', '{"duration":"1h","altitude":"400ft","photos":120,"notes":"Initial site assessment"}'),
(15, 'invoice_number', 'INV-2024-015'),
(15, 'invoice_paid', '1');

-- ============================================================
-- RECURRING (1 Template + 3 Occurrences)
-- ============================================================
TRUNCATE TABLE `Recurring_Job_Templates`;
INSERT INTO `Recurring_Job_Templates` (`id`, `active`, `is_manual`, `name`, `site_id`, `client_type`, `client_id`, `rrule`, `timezone`, `dtstart`, `dtend`, `window_days`, `last_generated_through`, `amount_payable`, `notes`, `products`, `created_by`) VALUES
(1, 1, 0, 'Tampa Riverwalk Monthly Progress',
   3, 'organization', 3,
   'FREQ=MONTHLY;INTERVAL=1;BYDAY=1MO',
   'America/New_York',
   '2025-01-06 09:00:00',
   '2025-06-30 09:00:00',
   60,
   '2025-04-07 09:00:00',
   2500.00,
   'Monthly construction progress survey - first Monday of each month',
   '[{"id":3,"name":"Construct Viewer"},{"id":6,"name":"Progress Video"}]',
   2);

TRUNCATE TABLE `Recurring_Job_Occurrences`;
INSERT INTO `Recurring_Job_Occurrences` (`id`, `template_id`, `occurrence_at`, `status`, `job_id`) VALUES
(1, 1, '2025-02-03 09:00:00', 'created', 9),
(2, 1, '2025-03-03 09:00:00', 'planned', NULL),
(3, 1, '2025-04-07 09:00:00', 'planned', NULL);

-- ============================================================
-- Clear empty tables
-- ============================================================
TRUNCATE TABLE `Job_Deliverable`;
TRUNCATE TABLE `Tilesets`;
TRUNCATE TABLE `Requests`;
TRUNCATE TABLE `Shares`;
TRUNCATE TABLE `Logs`;
TRUNCATE TABLE `Delivery_Email_Outbox`;
TRUNCATE TABLE `Delivery_Email_Items`;
TRUNCATE TABLE `Bulk_Action_Log`;
TRUNCATE TABLE `Templates`;

SET FOREIGN_KEY_CHECKS = 1;
