import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

export function useAuth() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: user, isLoading, error } = useQuery({
    queryKey: [api.auth.me.path],
    queryFn: async () => {
      const res = await fetch(api.auth.me.path, { credentials: 'include' });
      if (res.status === 401) return null;
      if (!res.ok) throw new Error("Failed to fetch user");
      return api.auth.me.responses[200].parse(await res.json());
    },
    retry: false,
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: z.infer<typeof api.auth.login.input>) => {
      const res = await fetch(api.auth.login.path, {
        method: api.auth.login.method,
        credentials: 'include',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });
      if (!res.ok) throw new Error("Invalid credentials");
      return api.auth.login.responses[200].parse(await res.json());
    },
    // After login, refetch the `/api/user` endpoint to ensure the session cookie was persisted
    onSuccess: async (data) => {
      const runDevSessionCheck = async () => {
        const isDevHost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
        const isDevEnv = typeof process !== 'undefined' && process.env && process.env.NODE_ENV !== 'production';
        if (!isDevHost && !isDevEnv) return;
        try {
          const dbgRes = await fetch('/api/debug/session', { credentials: 'include' });
          if (!dbgRes.ok) return console.log('[auth][dev] /api/debug/session returned', dbgRes.status);
          const info = await dbgRes.json();
          console.log('[auth][dev] session:', info);
          // Show a concise dev-only toast
          toast({ title: 'Logged in successfully ' });
        } catch (e) {
        }
      };

      try {
        // Refetch the "me" endpoint using the same credentials to confirm server session
        const meRes = await fetch(api.auth.me.path, { credentials: 'include' });
        if (meRes.status === 401) throw new Error('Session not persisted');
        if (!meRes.ok) throw new Error('Failed to fetch user');
        const meUser = api.auth.me.responses[200].parse(await meRes.json());

        // Update the cache with the authoritative server response
        queryClient.setQueryData([api.auth.me.path], meUser);
        toast({ title: "Welcome back!", description: `Logged in as ${data.username}` });
        await runDevSessionCheck();
      } catch (err: any) {
        // If fetching me failed, still set the cached user optimistically but warn the user
        queryClient.setQueryData([api.auth.me.path], data);
        toast({ title: "Login Warning", description: err.message || 'Login succeeded but session may not be persisted', variant: "destructive" });
        await runDevSessionCheck();
      }
    },
    onError: (error) => {
      toast({
        title: "Login Failed",
        description: error.message,
        variant: "destructive"
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(api.auth.logout.path, {
        method: api.auth.logout.method,
        credentials: 'include',
      });
      if (!res.ok) throw new Error("Logout failed");
    },
    onSuccess: async () => {
      // Clear cached user and ensure server-side session is gone
      queryClient.setQueryData([api.auth.me.path], null);
      await queryClient.invalidateQueries({ queryKey: [api.auth.me.path] });
      toast({ title: "Logged out" });
    },
  });

  return {
    user,
    isLoading,
    login: loginMutation.mutate,
    logout: logoutMutation.mutate,
    isLoggingIn: loginMutation.isPending,
  };
}
