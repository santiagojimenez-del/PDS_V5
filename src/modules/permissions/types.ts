export interface Permission {
  name: string;
  category: string | null;
  label: string | null;
  description: string | null;
  priority: number;
  hidden: boolean;
  enforce: boolean;
  eventWl: string[] | null;
  arrayKeyWl: string[] | null;
  htmlIdWl: string[] | null;
  jsWhitelist: string[] | null;
}

export interface Role {
  id: number;
  name: string;
  app: string;
  default: boolean;
  superadmin: boolean;
  authentication: boolean;
  permissions: string[];
}

export interface NavItem {
  pageId: number;
  page: string;
  title: string;
  icon: string;
  group: string | null;
  dropdown: { icon: string; title: string } | null;
  hidden: boolean;
  priority: number;
}

export interface NavGroup {
  name: string;
  items: NavItem[];
  dropdown?: { icon: string; title: string };
}
