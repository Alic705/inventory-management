import { useExpenses } from "@/hooks/use-expenses";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Plus, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api } from "@shared/routes";

const formSchema = api.expenses.create.input.extend({
  amount: z.coerce.number().min(1, "Amount required"),
});

type FormValues = z.infer<typeof formSchema>;

export default function Expenses() {
  const { expenses, isLoading, createExpense } = useExpenses();
  const [open, setOpen] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      category: "Utilities",
      description: "",
      amount: 0,
    }
  });

  const onSubmit = (data: FormValues) => {
    createExpense.mutate(data, {
      onSuccess: () => {
        setOpen(false);
        form.reset();
      }
    });
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-display font-bold">Expenses</h2>
          <p className="text-sm sm:text-base text-muted-foreground">Track daily operating costs.</p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-xl shadow-lg shadow-primary/25 w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" /> Add Expense
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl">Add Expense</DialogTitle>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select 
                  onValueChange={(val) => form.setValue("category", val)}
                  defaultValue="Utilities"
                >
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Rent">Rent</SelectItem>
                    <SelectItem value="Utilities">Utilities (Bijli/Pani)</SelectItem>
                    <SelectItem value="Salary">Salary</SelectItem>
                    <SelectItem value="Maintenance">Maintenance</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Input {...form.register("description")} className="rounded-xl" placeholder="Details..." />
              </div>

              <div className="space-y-2">
                <Label>Amount</Label>
                <Input type="number" {...form.register("amount")} className="rounded-xl" />
              </div>

              <div className="flex justify-end pt-4">
                <Button type="submit" disabled={createExpense.isPending} className="w-full sm:w-auto">
                  {createExpense.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Expense
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
                <TableHead className="min-w-[100px]">Date</TableHead>
                <TableHead className="min-w-[120px]">Category</TableHead>
                <TableHead className="min-w-[150px]">Description</TableHead>
                <TableHead className="text-right min-w-[100px]">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={4} className="text-center py-8">Loading...</TableCell></TableRow>
              ) : (
                expenses?.map(e => (
                  <TableRow key={e.id}>
                    <TableCell className="text-muted-foreground text-sm">{new Date(e.date).toLocaleDateString()}</TableCell>
                    <TableCell className="font-medium">{e.category}</TableCell>
                    <TableCell>{e.description || '-'}</TableCell>
                    <TableCell className="text-right font-bold text-destructive">Rs {e.amount}</TableCell>
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
