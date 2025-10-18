import { useQuery } from '@tanstack/react-query';

export function useSupabaseQuery<T>(
  key: string[],
  queryFn: () => Promise<{ data: T[] | null; error: any }>,
  options?: {
    enabled?: boolean;
    staleTime?: number;
  }
) {
  return useQuery({
    queryKey: key,
    queryFn: async () => {
      const result = await queryFn();
      if (result.error) throw result.error;
      return result.data || [];
    },
    staleTime: options?.staleTime ?? 30000, // Cache por 30 segundos
    enabled: options?.enabled ?? true,
  });
}
