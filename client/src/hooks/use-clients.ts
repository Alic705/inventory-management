import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";
import type {
  Client,
  InsertClient,
  InsertClientPayment,
  ClientSummary
} from "@shared/schema";

export function useClients() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: clients = [], isLoading, refetch } = useQuery<Client[]>({
    queryKey: [api.clients.list.path],
    queryFn: async () => {
      const res = await fetch(api.clients.list.path, { credentials: "include" });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Failed to fetch clients (${res.status})`);
      }
      return await res.json();
    },
  });

  const createClient = useMutation({
    mutationFn: async (data: InsertClient) => {
      const res = await fetch(api.clients.create.path, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        let errMsg = `Failed to create client (${res.status})`;
        try {
          const err = await res.json();
          errMsg = err.message || errMsg;
        } catch {
          const text = await res.text().catch(() => "");
          if (text && !text.startsWith("<!DOCTYPE")) errMsg = text;
        }
        throw new Error(errMsg);
      }
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.clients.list.path] });
      toast({ title: "Success", description: "Client created successfully" });
    },
    onError: (err: any) =>
      toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const updateClient = useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & Partial<InsertClient>) => {
      const url = buildUrl(api.clients.update.path, { id });
      const res = await fetch(url, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        let errMsg = `Failed to update client (${res.status})`;
        try {
          const err = await res.json();
          errMsg = err.message || errMsg;
        } catch {
          const text = await res.text().catch(() => "");
          if (text && !text.startsWith("<!DOCTYPE")) errMsg = text;
        }
        throw new Error(errMsg);
      }
      return await res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.clients.list.path] });
      queryClient.invalidateQueries({ queryKey: ["client", variables.id] });
      toast({ title: "Success", description: "Client updated successfully" });
    },
    onError: (err: any) =>
      toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const deleteClient = useMutation({
    mutationFn: async (id: string) => {
      const url = buildUrl(api.clients.delete.path, { id });
      const res = await fetch(url, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || `Failed to delete client (${res.status})`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.clients.list.path] });
      toast({ title: "Success", description: "Client deleted successfully" });
    },
    onError: (err: any) =>
      toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  return { clients, isLoading, refetch, createClient, updateClient, deleteClient };
}

export function useClientDetail(
  clientId: string,
  filter: string = "all",
  fromDate?: string,
  toDate?: string
) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const queryParams = new URLSearchParams();
  if (filter) queryParams.set("filter", filter);
  if (fromDate) queryParams.set("from", fromDate);
  if (toDate) queryParams.set("to", toDate);

  const url = `${buildUrl(api.clients.transactions.path, { id: clientId })}?${queryParams.toString()}`;

  const { data: summary, isLoading, refetch } = useQuery<ClientSummary>({
    queryKey: ["client-transactions", clientId, filter, fromDate, toDate],
    queryFn: async () => {
      if (!clientId) throw new Error("Client ID required");
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || `Failed to load client details (${res.status})`);
      }
      return await res.json();
    },
    enabled: !!clientId,
  });

  const recordPayment = useMutation({
    mutationFn: async (paymentData: Omit<InsertClientPayment, "clientId">) => {
      const postUrl = buildUrl(api.clients.createPayment.path, { id: clientId });
      const res = await fetch(postUrl, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(paymentData),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || `Failed to record payment (${res.status})`);
      }
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-transactions", clientId] });
      queryClient.invalidateQueries({ queryKey: [api.clients.list.path] });
      toast({ title: "Success", description: "Payment recorded successfully" });
    },
    onError: (err: any) =>
      toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const deletePayment = useMutation({
    mutationFn: async (paymentId: string) => {
      const deleteUrl = api.clients.deletePayment.path.replace(":paymentId", paymentId);
      const res = await fetch(deleteUrl, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || `Failed to delete payment (${res.status})`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-transactions", clientId] });
      queryClient.invalidateQueries({ queryKey: [api.clients.list.path] });
      toast({ title: "Success", description: "Payment record deleted" });
    },
    onError: (err: any) =>
      toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  return { summary, isLoading, refetch, recordPayment, deletePayment };
}
