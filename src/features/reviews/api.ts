// src/features/reviews/api.ts
import api from '@/lib/axios';

export interface CreateReviewPayload {
  userId: string;
  providerId: string;
  rating: number;
  comment: string;
}

export const createReview = (data: CreateReviewPayload) => {
  return api.post('/reviews', data);
};