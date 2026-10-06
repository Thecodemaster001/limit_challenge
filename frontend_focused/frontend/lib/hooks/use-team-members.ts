'use client';

import { useQuery } from '@tanstack/react-query';

import { apiClient } from '@/lib/api-client';
import { TeamMember } from '@/lib/types';

async function fetchTeamMembers() {
  const response = await apiClient.get<TeamMember[]>('/team-members/');
  return response.data;
}

export function useTeamMembers() {
  return useQuery({
    queryKey: ['team-members'],
    queryFn: fetchTeamMembers,
    staleTime: 5 * 60_000,
  });
}
