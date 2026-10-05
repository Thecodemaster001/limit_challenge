import { apiClient } from '@/lib/api-client';
import type { Credentials, TokenPair } from '@/lib/api/types';

export async function obtainTokenPair(credentials: Credentials): Promise<TokenPair> {
  const { data } = await apiClient.post<TokenPair>('/auth/token/', credentials);
  return data;
}
