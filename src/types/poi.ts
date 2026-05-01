export type PointOfInterest = {
  id?: string | number;
  name: string;
  description?: string;
  type?: string;
  category?: string;
  source?: string;
  bookingLink?: string;
  price?: number;
  latitude?: number;
  longitude?: number;
};