export interface Review {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  author: { id: string; email: string };
}
