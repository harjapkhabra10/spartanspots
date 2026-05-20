export type Spot = {
  id: number;
  name: string;
  location: string;
  description: string | null;
  image_url: string | null;
  has_outlets: boolean;
  has_whiteboards: boolean;
  has_food_nearby: boolean;
  has_natural_light: boolean;
  created_at?: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
};