import { useUsers } from "@/hooks/use-users";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/lib/i18n";
import { Redirect } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useState } from "react";
import { Loader2, UserPlus, Shield, Pencil, Trash2 } from "lucide-react";
import { type User } from "@shared/schema";

export default function Users() {
  const { user } = useAuth();
  const { users, isLoading, createUser, updateUser, deleteUser } = useUsers();
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<{ username: string; password: string; role: "admin" | "staff"; isActive: boolean; language: "en" | "ur" | "roman" }>({ username: "", password: "", role: "staff", isActive: true, language: "en" });

  // Only admin can access
  if (user && user.role !== 'admin') {
    return <Redirect to="/" />;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUser) {
      updateUser.mutate({ id: editingUser.id, ...formData }, {
        onSuccess: () => {
          setOpen(false);
          setEditingUser(null);
          setFormData({ username: "", password: "", role: "staff", isActive: true, language: "en" });
        }
      });
    } else {
      createUser.mutate(formData, {
        onSuccess: () => {
          setOpen(false);
          setFormData({ username: "", password: "", role: "staff", isActive: true, language: "en" });
        }
      });
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      password: "",
      role: user.role,
      isActive: user.isActive,
      language: (user as any).language || "en",
    });
    setOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm(t.confirmDelete)) {
      deleteUser.mutate(id);
    }
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-display font-bold">{t.userManagement}</h2>
          <p className="text-sm sm:text-base text-muted-foreground">{t.controlAccess}</p>
        </div>

        <Dialog open={open} onOpenChange={(v) => {
          setOpen(v);
          if (!v) {
            setEditingUser(null);
            setFormData({ username: "", password: "", role: "staff", isActive: true, language: "en" });
          }
        }}>
          <DialogTrigger asChild>
            <Button className="rounded-xl shadow-lg shadow-primary/25 w-full sm:w-auto">
              <UserPlus className="mr-2 h-4 w-4" /> {t.add} {t.users}
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl">{editingUser ? t.edit : t.createNewUser}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>{t.username}</Label>
                <Input
                  value={formData.username}
                  onChange={e => setFormData({ ...formData, username: e.target.value })}
                  className="rounded-xl"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>{t.password} {editingUser && t.leaveBlankToKeep}</Label>
                <Input
                  type="password"
                  value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                  className="rounded-xl"
                  required={!editingUser}
                />
              </div>
              <div className="space-y-2">
                <Label>{t.role}</Label>
                <Select
                  value={formData.role}
                  onValueChange={(val: "admin" | "staff") => setFormData({ ...formData, role: val })}
                >
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="staff">{t.staff}</SelectItem>
                    <SelectItem value="admin">{t.admin}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {editingUser && (
                <div className="flex items-center justify-between space-x-2">
                  <Label htmlFor="active">{t.status}</Label>
                  <div className="flex items-center gap-2">
                    <Switch
                      id="active"
                      checked={formData.isActive}
                      onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                    />
                    <Label htmlFor="active" className="text-sm">
                      {formData.isActive ? t.active : t.inactive}
                    </Label>
                  </div>
                </div>
              )}
              <div className="flex justify-end pt-4">
                <Button type="submit" disabled={createUser.isPending || updateUser.isPending} className="w-full sm:w-auto">
                  {(createUser.isPending || updateUser.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingUser ? t.save : t.createUser}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="rounded-2xl border-border/50 shadow-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="min-w-[150px]">{t.username}</TableHead>
                  <TableHead className="min-w-[100px]">{t.role}</TableHead>
                  <TableHead className="min-w-[100px]">{t.status}</TableHead>
                  <TableHead className="min-w-[120px]">{t.createdAt}</TableHead>
                  <TableHead className="min-w-[100px]">{t.actions}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-8">{t.loading}</TableCell></TableRow>
                ) : users?.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">{t.noUsersFound}</TableCell></TableRow>
                ) : (
                  users?.map(u => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs flex-shrink-0">
                            {u.username.substring(0, 2).toUpperCase()}
                          </div>
                          <span>{u.username}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${u.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                          {u.role === 'admin' && <Shield className="w-3 h-3 mr-1" />}
                          {u.role === 'admin' ? t.admin : t.staff}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${u.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                          {u.isActive ? t.active : t.inactive}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {new Date(u.createdAt!).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleEdit(u)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDelete(u.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
