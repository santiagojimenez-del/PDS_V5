export interface AppConfig {
  [key: string]: string | number | boolean | object | null;
}

export interface MaintenanceConfig {
  enabled: boolean;
  whitelist: number[];
  message: string;
}

export interface PipeConfig {
  id: string;
  name: string;
  color: string;
}

export interface RoleConfig {
  id: number;
  name: string;
  app: string;
  default: boolean;
  superadmin: boolean;
  authentication: boolean;
  permissions: string[];
}

export interface GoogleOAuthConfig {
  client: string;
  client_secret: string;
  redirect_url: string;
}
