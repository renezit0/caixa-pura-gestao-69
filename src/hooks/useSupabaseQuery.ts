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
    staleTime: options?.staleTime ?? 5000, // Cache por 5 segundos (reduzido de 30s)
    enabled: options?.enabled ?? true,
    refetchOnWindowFocus: true, // Atualiza quando volta para a aba
    refetchOnMount: true, // Atualiza ao montar
  });
}
