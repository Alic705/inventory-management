import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

type ExpenseFilter = "all" | "admin" | { userId: string };

export function useExpenses(filter: ExpenseFilter = "all") {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const buildUrl = () => {
    const params = new URLSearchParams();

    if (filter === "admin") {
      params.append("admin", "true");
    } else if (typeof filter === "object" && filter.userId) {
      params.append("userId", filter.userId);
    }

    const qs = params.toString();
    return qs
      ? `${api.expenses.list.path}?${qs}`
      : api.expenses.list.path;
  };

  const { data: expenses, isLoading, refetch } = useQuery({
    queryKey: [api.expenses.list.path, filter],
    queryFn: async () => {
      const res = await fetch(buildUrl(), {
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch expenses (${res.status})`);
      }

      return api.expenses.list.responses[200].parse(await res.json());
    },

  });

  const createExpense = useMutation({
    mutationFn: async (data: z.infer<typeof api.expenses.create.input>) => {
      const res = await fetch(api.expenses.create.path, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        throw new Error(await res.text());
      }

      return api.expenses.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.expenses.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.stats.get.path] });
      toast({ title: "Success", description: "Expense recorded" });
    },
    onError: (err: any) =>
      toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const updateExpense = useMutation({
    mutationFn: async ({
      id,
      ...data
    }: { id: string } & z.infer<typeof api.expenses.update.input>) => {
      const res = await fetch(
        api.expenses.update.path.replace(":id", id),
        {
          method: "PUT",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        }
      );

      if (!res.ok) {
        throw new Error(await res.text());
      }

      return api.expenses.update.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.expenses.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.stats.get.path] });
      toast({ title: "Success", description: "Expense updated" });
    },
    onError: (err: any) =>
      toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const deleteExpense = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(
        api.expenses.delete.path.replace(":id", id),
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      if (!res.ok) {
        throw new Error(await res.text());
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.expenses.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.stats.get.path] });
      toast({ title: "Success", description: "Expense deleted" });
    },
    onError: (err: any) =>
      toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  return {
    expenses,
    isLoading,
    createExpense,
    updateExpense,
    deleteExpense,
    refetch,
  };
}
