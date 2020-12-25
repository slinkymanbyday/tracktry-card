export interface TracktryCardConfig {
  type: string;
  entity: string;
  title?: string;
  show_add?: boolean;
}

export interface Tracking {
  name: string;
  tracking_number: string;
  slug: string;
  last_update: string;
  status: string;
  status_description: string;
  location: string;
}
