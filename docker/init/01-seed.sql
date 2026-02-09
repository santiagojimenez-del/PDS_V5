-- Seed data for development
-- Admin user: admin@prodrones.com / password123
-- Client user: client@prodrones.com / password123

SET NAMES utf8mb4;

-- Insert admin user (bcrypt hash of 'password123' with cost 11)
INSERT INTO `Users` (`Email`, `Password`, `Tokens`) VALUES
('admin@prodrones.com', '$2a$11$rQbfRCH9MYX1YeCj0bR7aOCqSxJx2tXjK0qN5vIpKfJ8YXJh0gKOe', '[]'),
('manager@prodrones.com', '$2a$11$rQbfRCH9MYX1YeCj0bR7aOCqSxJx2tXjK0qN5vIpKfJ8YXJh0gKOe', '[]'),
('pilot@prodrones.com', '$2a$11$rQbfRCH9MYX1YeCj0bR7aOCqSxJx2tXjK0qN5vIpKfJ8YXJh0gKOe', '[]'),
('staff@prodrones.com', '$2a$11$rQbfRCH9MYX1YeCj0bR7aOCqSxJx2tXjK0qN5vIpKfJ8YXJh0gKOe', '[]'),
('client@prodrones.com', '$2a$11$rQbfRCH9MYX1YeCj0bR7aOCqSxJx2tXjK0qN5vIpKfJ8YXJh0gKOe', '[]');

-- User Meta (roles, names)
INSERT INTO `User_Meta` (`uid`, `meta_key`, `meta_value`) VALUES
(1, 'first_name', 'Admin'),
(1, 'last_name', 'User'),
(1, 'FullName', 'Admin User'),
(1, 'roles', '[0]'),
(1, 'permissions', '[]'),
(2, 'first_name', 'Manager'),
(2, 'last_name', 'User'),
(2, 'FullName', 'Manager User'),
(2, 'roles', '[7]'),
(2, 'permissions', '[]'),
(3, 'first_name', 'Pilot'),
(3, 'last_name', 'User'),
(3, 'FullName', 'Pilot User'),
(3, 'roles', '[6]'),
(3, 'permissions', '[]'),
(4, 'first_name', 'Staff'),
(4, 'last_name', 'User'),
(4, 'FullName', 'Staff User'),
(4, 'roles', '[5]'),
(4, 'permissions', '[]'),
(5, 'first_name', 'Client'),
(5, 'last_name', 'User'),
(5, 'FullName', 'Client User'),
(5, 'roles', '[1]'),
(5, 'permissions', '[]');

-- Configuration
INSERT INTO `Configuration` (`Application`, `Name`, `Value`) VALUES
('', 'api_server', '/api'),
('', 'login_form', 'login'),
('', 'session_name', 'pds_session'),
('', 'request_token_var', 'request'),
('', 'share_token_var', 'share'),
('', 'primary_app', 'hub'),
('', 'mail_email', 'office@prodrones.com'),
('', 'mail_name', 'PDS'),
('', 'maintenance', '{"enabled":false,"whitelist":[1],"message":"System is under maintenance."}'),
('', 'roles', '[{"id":0,"name":"Admin","app":"hub","default":false,"superadmin":true,"authentication":true,"permissions":[]},{"id":1,"name":"Client","app":"client","default":false,"superadmin":false,"authentication":false,"permissions":[]},{"id":5,"name":"Staff","app":"hub","default":true,"superadmin":false,"authentication":false,"permissions":[]},{"id":6,"name":"Pilot","app":"hub","default":false,"superadmin":false,"authentication":false,"permissions":[]},{"id":7,"name":"Manager","app":"hub","default":false,"superadmin":false,"authentication":false,"permissions":[]}]'),
('', 'pipes', '[{"id":"bids","name":"Bids","color":"#6366f1"},{"id":"scheduled","name":"Scheduled","color":"#f59e0b"},{"id":"processing-deliver","name":"Processing / Deliver","color":"#3b82f6"},{"id":"bill","name":"Bill","color":"#10b981"},{"id":"completed","name":"Completed","color":"#6b7280"}]'),
('hub', 'domain', 'hub.prodrones.com'),
('hub', 'role_access', '[0, 7, 5, 6]'),
('hub', 'site_title', 'ProDrones Hub'),
('hub', 'site_logo', '/img/logo/PDSLogo1-ud02.2022.png'),
('hub', 'site_logo_sm', '/img/logo/PDSLogo-sm.png'),
('hub', 'cdn_server', 'http://localhost:3003'),
('hub', 'socket_server', 'http://localhost:3003'),
('client', 'domain', 'client.prodrones.com'),
('client', 'client_role', '1'),
('client', 'site_title', 'ProDrones Client Portal'),
('client', 'role_access', '[1]'),
('admin', 'domain', 'admin.prodrones.com'),
('admin', 'site_title', 'ProDrones Admin'),
('admin', 'role_access', '[0]');

-- Products
INSERT INTO `Products` (`id`, `name`, `deliverable_template`, `meta_defaults`, `configuration`) VALUES
(1, 'Landscape Viewer', 'landscape_viewer', '[]', '{}'),
(2, 'Community Viewer', 'community_viewer', '[]', '{}'),
(3, 'Construct Viewer', 'construct_viewer', '[]', '{}'),
(4, 'Custom Photography', NULL, '[]', NULL),
(5, 'Roof Inspection', NULL, '[]', NULL),
(6, 'Progress Video', NULL, '[]', NULL),
(7, 'Orthomosaic Map', NULL, '[]', NULL),
(8, '3D Model', NULL, '[]', NULL);

-- Pages (Hub)
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

-- Pages (Client)
INSERT INTO `Pages` (`Application`, `Page`, `Wrapper`, `Template`, `Priority`, `Hidden`, `Shareable`, `RoleAccess`, `PermissionAccess`, `Design`, `NavGroup`) VALUES
('client', '', 'standard', NULL, 1, 0, 0, NULL, NULL, '{"icon":"<i class=\\"ti ti-home\\"></i>","title":"Home"}', NULL),
('client', 'sites', 'standard', NULL, 2, 0, 0, NULL, NULL, '{"icon":"<i class=\\"ti ti-map\\"></i>","title":"Project List"}', '{"group":"Projects"}'),
('client', 'site', 'standard', NULL, 3, 1, 0, NULL, NULL, '{"icon":"<i class=\\"ti ti-map-pin\\"></i>","title":"Site Details"}', '{"group":"Projects"}'),
('client', 'job', 'standard', NULL, 4, 1, 0, NULL, '["view_all_jobs"]', '{"icon":"<i class=\\"ti ti-briefcase\\"></i>","title":"View Project"}', '{"group":"Projects"}'),
('client', 'job/product', 'standard', NULL, 5, 1, 1, NULL, '["view_all_jobs"]', '{"icon":"<i class=\\"ti ti-package\\"></i>","title":"View Product"}', NULL);

-- Pages (Admin)
INSERT INTO `Pages` (`Application`, `Page`, `Wrapper`, `Template`, `Priority`, `Hidden`, `Shareable`, `RoleAccess`, `PermissionAccess`, `Design`, `NavGroup`) VALUES
('admin', '', 'standard', NULL, 1, 0, 0, NULL, NULL, '{"icon":"<i class=\\"ti ti-dashboard\\"></i>","title":"Dashboard"}', NULL),
('admin', 'users/search', 'standard', NULL, 2, 0, 0, NULL, NULL, '{"icon":"<i class=\\"ti ti-search\\"></i>","title":"User Search"}', '{"group":"Users"}'),
('admin', 'users/view', 'standard', NULL, 3, 1, 0, NULL, NULL, '{"icon":"<i class=\\"ti ti-user\\"></i>","title":"View User"}', '{"group":"Users"}'),
('admin', 'users/roles', 'standard', NULL, 4, 0, 0, NULL, '["view_roles_and_permissions"]', '{"icon":"<i class=\\"ti ti-shield\\"></i>","title":"Roles & Permissions"}', '{"group":"Users"}'),
('admin', 'developer/active-visitors', 'standard', NULL, 5, 0, 0, NULL, '["developer_tools"]', '{"icon":"<i class=\\"ti ti-activity\\"></i>","title":"Active Connections"}', '{"group":"Developer Tools"}');

-- Pages (Global / Auth)
INSERT INTO `Pages` (`Application`, `Page`, `Wrapper`, `Template`, `Priority`, `Hidden`, `Shareable`, `RoleAccess`, `PermissionAccess`, `Design`, `NavGroup`) VALUES
('', 'login', 'blank', 'login', 1, 0, 0, '[]', NULL, '{"icon":"","title":"Login"}', NULL),
('', 'register', 'blank', 'register', 2, 0, 0, '[]', NULL, '{"icon":"","title":"Register"}', NULL),
('', 'forgot-password', 'blank', 'forgot-password', 3, 0, 0, '[]', NULL, '{"icon":"","title":"Forgot Password"}', NULL),
('', 'reset-password', 'blank', 'reset-password', 4, 0, 0, '[]', NULL, '{"icon":"","title":"Reset Password"}', NULL),
('', 'settings', 'standard', 'settings', 5, 0, 0, NULL, NULL, '{"icon":"<i class=\\"ti ti-settings\\"></i>","title":"Settings"}', NULL);

-- Sample Sites
INSERT INTO `Sites` (`createdBy`, `name`, `description`, `address`, `coordinates`, `boundary`) VALUES
(1, 'Downtown Office Complex', 'Main office building aerial survey', '123 Main St, Miami, FL 33101', '{"lat":25.7617,"lng":-80.1918}', NULL),
(1, 'Sunrise Community HOA', 'HOA property inspection area', '456 Palm Ave, Fort Lauderdale, FL 33301', '{"lat":26.1224,"lng":-80.1373}', NULL),
(1, 'Construction Site Alpha', 'New development progress tracking', '789 Builder Rd, Tampa, FL 33602', '{"lat":27.9506,"lng":-82.4572}', NULL);

-- Sample Organization
INSERT INTO `Organization` (`name`) VALUES
('Acme Development Corp'),
('Sunrise HOA Management'),
('Tampa Construction LLC');

INSERT INTO `Organization_Meta` (`org_id`, `meta_key`, `meta_value`) VALUES
(1, 'contacts', '[{"user_id":5,"primary":true}]'),
(1, 'StreetAddress', '100 Corporate Blvd'),
(1, 'City', 'Miami'),
(1, 'State', 'FL'),
(1, 'ZipCode', '33101'),
(2, 'contacts', '[]'),
(2, 'City', 'Fort Lauderdale'),
(2, 'State', 'FL'),
(3, 'contacts', '[]'),
(3, 'City', 'Tampa'),
(3, 'State', 'FL');

-- Sample Jobs
INSERT INTO `Jobs` (`pipeline`, `createdBy`, `name`, `client`, `dates`, `siteId`, `products`) VALUES
('bids', 1, 'Downtown Survey Q1', '{"id":1,"type":"organization","name":"Acme Development Corp"}', '{"created":"2025-01-15T10:00:00.000Z"}', 1, '[{"id":1,"name":"Landscape Viewer"}]'),
('scheduled', 1, 'HOA Spring Inspection', '{"id":2,"type":"organization","name":"Sunrise HOA Management"}', '{"created":"2025-01-10T10:00:00.000Z","scheduled":"2025-02-15T09:00:00.000Z"}', 2, '[{"id":2,"name":"Community Viewer"},{"id":5,"name":"Roof Inspection"}]'),
('processing-deliver', 1, 'Construction Progress Feb', '{"id":3,"type":"organization","name":"Tampa Construction LLC"}', '{"created":"2025-01-05T10:00:00.000Z","scheduled":"2025-01-20T09:00:00.000Z","flown":"2025-01-20T14:00:00.000Z","logged":"2025-01-20T16:00:00.000Z"}', 3, '[{"id":3,"name":"Construct Viewer"},{"id":6,"name":"Progress Video"}]');

-- Job Meta for scheduled job
INSERT INTO `Job_Meta` (`job_id`, `meta_key`, `meta_value`) VALUES
(2, 'approved_flight', '1'),
(2, 'scheduled_flight', '2025-02-15T09:00:00.000Z'),
(2, 'persons_assigned', '[3]'),
(3, 'approved_flight', '1'),
(3, 'scheduled_flight', '2025-01-20T09:00:00.000Z'),
(3, 'persons_assigned', '[3]'),
(3, 'flight_log', '{"duration":"2h","altitude":"400ft","photos":245}');

-- Permissions
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
