'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';

import { apiClient } from '@/lib/api-client';
import { CurrentUser, LoginCredentials } from '@/lib/types';

const CURRENT_USER_QUERY_KEY = ['current-user'];

async function fetchCurrentUser() {
  const response = await apiClient.get<CurrentUser>('/auth/me/');
  return response.data;
}

async function logIn(credentials: LoginCredentials) {
  const response = await apiClient.post<CurrentUser>('/auth/login/', credentials);
  return response.data;
}

async function logOut() {
  await apiClient.post('/auth/logout/');
}

export function useCurrentUser() {
  return useQuery({
    queryKey: CURRENT_USER_QUERY_KEY,
    queryFn: fetchCurrentUser,
    staleTime: Infinity,
  });
}

export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: logIn,
    onSuccess: (user) => {
      queryClient.clear();
      queryClient.setQueryData(CURRENT_USER_QUERY_KEY, user);
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  const router = useRouter();
  return useMutation({
    mutationFn: logOut,
    onSettled: () => {
      queryClient.clear();
      router.replace('/login');
    },
  });
}
