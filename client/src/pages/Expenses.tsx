import { useExpenses } from "@/hooks/use-expenses";
import { useAuth } from "@/hooks/use-auth";
import { useUsers } from "@/hooks/use-users";
import { useI18n } from "@/lib/i18n";
import { getCategoryName } from "@/lib/productNames";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Plus, Loader2, Pencil, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api } from "@shared/routes";
import { type Expense } from "@shared/schema";

const formSchema = api.expenses.create.input.extend({
  amount: z.coerce.number().min(1, "Amount required"),
});

type FormValues = z.infer<typeof formSchema>;

export default function Expenses() {
  const { user } = useAuth();
  const { users } = useUsers();
  const { t, language } = useI18n();
  const [open, setOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  type ExpenseFilter = "all" | "admin" | { userId: string };

  const [userFilter, setUserFilter] = useState<ExpenseFilter>("all");
  const isAdmin = user?.role === 'admin';
  const { expenses, isLoading, createExpense, updateExpense, deleteExpense } =
    useExpenses(userFilter);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      category: "Utilities",
      description: "",
      amount: 0,
    }
  });

  const onSubmit = (data: FormValues) => {
    if (editingExpense) {
      updateExpense.mutate({ id: editingExpense.id, ...data }, {
        onSuccess: () => {
          setOpen(false);
          setEditingExpense(null);
          form.reset();
        }
      });
    } else {
      createExpense.mutate(data, {
        onSuccess: () => {
          setOpen(false);
          form.reset();
        }
      });
    }
  };

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
    form.reset({
      category: expense.category,
      description: expense.description || "",
      amount: expense.amount,
    });
    setOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm(t.confirmDelete)) {
      deleteExpense.mutate(id);
    }
  };

  // Expenses are already filtered by the hook, but we keep this for non-admin users
  const filteredExpenses = expenses;

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-display font-bold">{t.expenses}</h2>
          <p className="text-sm sm:text-base text-muted-foreground">{t.trackDailyCosts}</p>
        </div>

        {isAdmin && (
          <Select
            value={
              userFilter === "all"
                ? "all"
                : userFilter === "admin"
                  ? "admin"
                  : String(userFilter.userId)
            }
            onValueChange={(val) => {
              if (val === "all") {
                setUserFilter("all");
              } else if (val === "admin") {
                setUserFilter("admin");
              } else {
                setUserFilter({ userId: val });
              }
            }}
          >
            <SelectTrigger className="w-[200px] rounded-xl">
              <SelectValue placeholder={t.filterByUser} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t.allExpenses}</SelectItem>
              <SelectItem value="admin">{t.adminOnly}</SelectItem>
              {users?.map(u => (
                <SelectItem key={u.id} value={String(u.id)}>
                  {u.username}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <Dialog open={open} onOpenChange={(v) => {
          setOpen(v);
          if (!v) {
            setEditingExpense(null);
            form.reset();
          }
        }}>
          <DialogTrigger asChild>
            <Button className="rounded-xl shadow-lg shadow-primary/25 w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" /> {t.addExpense}
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl">{editingExpense ? t.edit : t.addExpense}</DialogTitle>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>{t.category}</Label>
                <Select
                  onValueChange={(val) => form.setValue("category", val)}
                  value={form.watch("category")}
                >
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Rent">{language === 'ur' ? 'کرایہ' : language === 'roman' ? 'Kiraya' : 'Rent'}</SelectItem>
                    <SelectItem value="Utilities">{language === 'ur' ? 'بل (بجلی/پانی)' : language === 'roman' ? 'Bijli/Pani' : 'Utilities'}</SelectItem>
                    <SelectItem value="Salary">{language === 'ur' ? 'تنخواہ' : language === 'roman' ? 'Tankhwa' : 'Salary'}</SelectItem>
                    <SelectItem value="Maintenance">{language === 'ur' ? 'مرمت' : language === 'roman' ? 'Marammat' : 'Maintenance'}</SelectItem>
                    <SelectItem value="Other">{language === 'ur' ? 'دیگر' : language === 'roman' ? 'Dosray' : 'Other'}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{t.description}</Label>
                <Input {...form.register("description")} className="rounded-xl" placeholder={t.description} />
              </div>

              <div className="space-y-2">
                <Label>{t.amount}</Label>
                <Input type="number" {...form.register("amount")} className="rounded-xl" />
              </div>

              <div className="flex justify-end pt-4">
                <Button type="submit" disabled={createExpense.isPending || updateExpense.isPending} className="w-full sm:w-auto">
                  {(createExpense.isPending || updateExpense.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {t.saveExpense}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="rounded-2xl border-border/50 shadow-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead className="min-w-[100px]">{t.date}</TableHead>
                {isAdmin && <TableHead className="min-w-[120px]">{t.user}</TableHead>}
                <TableHead className="min-w-[120px]">{t.category}</TableHead>
                <TableHead className="min-w-[150px]">{t.description}</TableHead>
                <TableHead className="text-right min-w-[100px]">{t.amount}</TableHead>
                {isAdmin && <TableHead className="min-w-[100px]">{t.actions}</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={isAdmin ? 6 : 4} className="text-center py-8">{t.loading}</TableCell></TableRow>
              ) : filteredExpenses?.length === 0 ? (
                <TableRow><TableCell colSpan={isAdmin ? 6 : 4} className="text-center py-8 text-muted-foreground">{t.noExpensesFound}</TableCell></TableRow>
              ) : (
                filteredExpenses?.map(e => (
                  <TableRow key={e.id}>
                    <TableCell className="text-muted-foreground text-sm">{new Date(e.date).toLocaleDateString()}</TableCell>
                    {isAdmin && (
                      <TableCell className="font-medium">
                        {e.user ? e.user.username : t.admin}
                      </TableCell>
                    )}
                    <TableCell className="font-medium">
                      {e.category === 'Rent' ? (language === 'ur' ? 'کرایہ' : language === 'roman' ? 'Kiraya' : 'Rent') :
                        e.category === 'Utilities' ? (language === 'ur' ? 'بل' : language === 'roman' ? 'Bijli/Pani' : 'Utilities') :
                          e.category === 'Salary' ? (language === 'ur' ? 'تنخواہ' : language === 'roman' ? 'Tankhwa' : 'Salary') :
                            e.category === 'Maintenance' ? (language === 'ur' ? 'مرمت' : language === 'roman' ? 'Marammat' : 'Maintenance') :
                              e.category}
                    </TableCell>
                    <TableCell>{e.description || '-'}</TableCell>
                    <TableCell className="text-right font-bold text-destructive">Rs {e.amount}</TableCell>
                    {isAdmin && (
                      <TableCell>
                        <div className="flex gap-2 justify-end">
                          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleEdit(e)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDelete(e.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
