export type TravelPlan = {
  id: number;
  userId: number;

  name: string;
  description?: string;

  startDate: string;
  endDate: string;
  createdAt: string;

  savedAccommodations?: any[];
  savedActivities?: any[];
  savedPois?: any[];
  savedTransports?: any[];
};