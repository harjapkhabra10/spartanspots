export type Review = {
  id: number;
  spot_id: number;
  overall_rating: number;
  quiet_level: number;
  crowd_level: number;
  comfort_rating: number;
  review_text: string | null;
  created_at?: string;
};