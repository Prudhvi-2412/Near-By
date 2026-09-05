export interface AppNotification {
  id: string;
  type: string;
  title: string;
  body: string;
  channel: string;
  readAt: string | null;
  createdAt: string;
}
