export interface SessionToken {
  type: "session";
  token: string;
  domain: string;
  expire: number;
  options: {
    ip: string;
    geography?: {
      city?: string;
      regionName?: string;
    };
    browser?: {
      user_agent: string;
      browser?: string;
      platform?: string;
    };
    created: number;
  };
}

export interface TwoFactorSessionToken {
  type: "two-factor-session";
  token: string;
  domain: string;
  expire: number;
  options: {
    ip: string;
    browser?: {
      user_agent: string;
    };
    created: number;
  };
}

export interface VerificationToken {
  type: "verification";
  token: string;
  expire: number;
  options: {
    code: string; // encrypted 6-digit code
    passed: boolean;
  };
}

export interface RegisterToken {
  type: "register";
  token: string;
  expire: number;
}

export interface PasswordResetToken {
  type: "pass-reset";
  token: string;
  expire: number;
}

export type UserToken =
  | SessionToken
  | TwoFactorSessionToken
  | VerificationToken
  | RegisterToken
  | PasswordResetToken;

export interface AuthUser {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  roles: number[];
  permissions: string[];
  twoFactorRequired: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface TwoFactorRequest {
  code: string;
  sessionToken: string;
}
