import { useState } from "react";
import { Link, Redirect } from "wouter";
import { useClients } from "@/hooks/use-clients";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Users as UsersIcon,
  UserPlus,
  Pencil,
  Trash2,
  Search,
  BookOpen,
  ArrowUpRight,
  ArrowDownLeft,
  Building2,
  Phone,
  Scale,
  Plus,
  Loader2,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
} from "lucide-react";
import { useTranslate } from "@/hooks/use-translate";
import type { Client, ClientType, InsertClient } from "@shared/schema";

export default function Clients() {
  const { user } = useAuth();
  const { clients, isLoading, createClient, updateClient, deleteClient } = useClients();
  const { t, language } = useI18n();
  const { translateCustom } = useTranslate();


  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [balanceFilter, setBalanceFilter] = useState<string>("all");
  const [open, setOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [copiedPhone, setCopiedPhone] = useState<string | null>(null);

  const [formData, setFormData] = useState<InsertClient>({
    name: "",
    phone: "",
    email: "",
    address: "",
    company: "",
    type: "both",
    openingBalance: 0,
    notes: "",
    isActive: true,
  });

  // Strict Admin Only Access
  if (user && user.role !== "admin") {
    return <Redirect to="/" />;
  }

  const handleOpenCreate = () => {
    setEditingClient(null);
    setFormData({
      name: "",
      phone: "",
      email: "",
      address: "",
      company: "",
      type: "both",
      openingBalance: 0,
      notes: "",
      isActive: true,
    });
    setOpen(true);
  };

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setFormData({
      name: client.name,
      phone: client.phone || "",
      email: client.email || "",
      address: client.address || "",
      company: client.company || "",
      type: client.type || "both",
      openingBalance: client.openingBalance || 0,
      notes: client.notes || "",
      isActive: client.isActive !== false,
    });
    setOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingClient) {
      updateClient.mutate(
        { id: editingClient.id || (editingClient as any)._id, ...formData },
        {
          onSuccess: () => {
            setOpen(false);
            setEditingClient(null);
          },
        }
      );
    } else {
      createClient.mutate(formData, {
        onSuccess: () => {
          setOpen(false);
        },
      });
    }
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`${t.confirmDelete} (${name})`)) {
      deleteClient.mutate(id);
    }
  };

  const handleCopyPhone = (phone: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(phone);
    setCopiedPhone(phone);
    setTimeout(() => setCopiedPhone(null), 2000);
  };

  // Filter clients by search, type, and balance
  const filteredClients = clients.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.company && c.company.toLowerCase().includes(search.toLowerCase())) ||
      (c.phone && c.phone.includes(search));

    const matchesType = typeFilter === "all" || c.type === typeFilter;

    const balance = c.netBalance || 0;
    let matchesBalance = true;
    if (balanceFilter === "receivable") matchesBalance = balance > 0;
    else if (balanceFilter === "payable") matchesBalance = balance < 0;
    else if (balanceFilter === "settled") matchesBalance = balance === 0;

    return matchesSearch && matchesType && matchesBalance;
  });

  // Calculate high-level summary KPIs
  const totalReceivable = clients.reduce((sum, c) => {
    const balance = c.netBalance || 0;
    return balance > 0 ? sum + balance : sum;
  }, 0);

  const totalPayable = clients.reduce((sum, c) => {
    const balance = c.netBalance || 0;
    return balance < 0 ? sum + Math.abs(balance) : sum;
  }, 0);

  const activeClientsCount = clients.filter((c) => c.isActive !== false).length;
  const netTotal = totalReceivable - totalPayable;

  const getTypeBadge = (type: ClientType) => {
    switch (type) {
      case "customer":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
            {t.customer}
          </span>
        );
      case "supplier":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
            {t.supplierType}
          </span>
        );
      case "both":
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">
            {t.bothType}
          </span>
        );
    }
  };

  const getInitials = (name: string) => {
    return name
      .trim()
      .split(" ")
      .map((part) => part[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  const statCards = [
    {
      title: t.clients,
      value: clients.length.toString(),
      subtext: `${activeClientsCount} ${t.active}`,
      icon: UsersIcon,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      title: t.receivable,
      value: `Rs. ${totalReceivable.toLocaleString()}`,
      subtext: language === 'ur' ? 'گاہکوں سے وصول طلب' : language === 'roman' ? 'Gahakon se vasool talab' : 'Pending from customers',
      icon: ArrowDownLeft,
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-100 dark:bg-emerald-900/20",
    },
    {
      title: t.payable,
      value: `Rs. ${totalPayable.toLocaleString()}`,
      subtext: language === 'ur' ? 'سپلائرز کو واجب الادا' : language === 'roman' ? 'Suppliers ko wajib ul ada' : 'Pending to suppliers',
      icon: ArrowUpRight,
      color: "text-rose-600 dark:text-rose-400",
      bg: "bg-rose-100 dark:bg-rose-900/20",
    },
    {
      title: t.netBalance,
      value: `${netTotal >= 0 ? "+" : "-"}Rs. ${Math.abs(netTotal).toLocaleString()}`,
      subtext: netTotal >= 0
        ? (language === 'ur' ? 'خالص مثبت پوزیشن' : language === 'roman' ? 'Positive Inflow' : 'Net Positive Inflow')
        : (language === 'ur' ? 'خالص منفی پوزیشن' : language === 'roman' ? 'Negative Outflow' : 'Net Outflow Due'),
      icon: Scale,
      color: netTotal >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400",
      bg: netTotal >= 0 ? "bg-emerald-100 dark:bg-emerald-900/20" : "bg-rose-100 dark:bg-rose-900/20",
    },
  ];

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-4 md:space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-display font-bold">{t.clientManagement}</h2>
          <p className="text-sm sm:text-base text-muted-foreground">{t.clientList}</p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleOpenCreate} className="rounded-xl shadow-lg shadow-primary/25 w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" /> {t.addClient}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[550px] rounded-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl font-display font-bold">
                {editingClient ? t.editClient : t.addClient}
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                {editingClient
                  ? (language === 'ur' ? 'کلائنٹ کی معلومات اور کھاتہ اپ ڈیٹ کریں۔' : 'Update party details and opening balance.')
                  : (language === 'ur' ? 'نیا گاہک یا سپلائر کھاتے میں شامل کریں۔' : 'Add a new customer, supplier, or business partner.')}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="client-name">{t.clientName} *</Label>
                  <Input
                    id="client-name"
                    placeholder="e.g. Haji Muhammad Ali"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="rounded-xl"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="client-company">{t.company}</Label>
                  <Input
                    id="client-company"
                    placeholder="e.g. Ali Traders / Sabzi Mandi"
                    value={formData.company || ""}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    className="rounded-xl"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="client-phone">{t.phone}</Label>
                  <Input
                    id="client-phone"
                    placeholder="0300-1234567"
                    value={formData.phone || ""}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="rounded-xl font-mono"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="client-type">{t.clientType}</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(val: ClientType) => setFormData({ ...formData, type: val })}
                  >
                    <SelectTrigger id="client-type" className="rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="both">{t.bothType}</SelectItem>
                      <SelectItem value="customer">{t.customer}</SelectItem>
                      <SelectItem value="supplier">{t.supplierType}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="client-email">{t.email}</Label>
                  <Input
                    id="client-email"
                    type="email"
                    placeholder="name@example.com"
                    value={formData.email || ""}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="rounded-xl"
                  />
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="client-opening-balance">
                    {t.openingBalance} (Rs.)
                  </Label>
                  <Input
                    id="client-opening-balance"
                    type="number"
                    placeholder="0 (Positive = Receivable, Negative = Payable)"
                    value={formData.openingBalance || 0}
                    onChange={(e) =>
                      setFormData({ ...formData, openingBalance: parseFloat(e.target.value) || 0 })
                    }
                    className="rounded-xl font-mono"
                  />
                  <p className="text-xs text-muted-foreground">
                    {language === 'ur'
                      ? 'مثبت (+) رقم = گاہک سے لینی ہے، منفی (-) رقم = سپلائر کو دینی ہے'
                      : language === 'roman'
                      ? 'Positive (+) = Vasool karna hai, Negative (-) = Ada karna hai'
                      : 'Positive (+) = Client owes you, Negative (-) = You owe client'}
                  </p>
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="client-address">{t.address}</Label>
                  <Input
                    id="client-address"
                    placeholder="Shop #, Market, City"
                    value={formData.address || ""}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="rounded-xl"
                  />
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="client-notes">{t.notes}</Label>
                  <Input
                    id="client-notes"
                    placeholder="Extra notes, credit terms, remarks"
                    value={formData.notes || ""}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="rounded-xl"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t">
                <Label htmlFor="client-active" className="cursor-pointer font-medium">
                  {t.status}: {formData.isActive !== false ? t.active : t.inactive}
                </Label>
                <Switch
                  id="client-active"
                  checked={formData.isActive !== false}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                />
              </div>

              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setOpen(false)}
                  className="rounded-xl w-full sm:w-auto"
                >
                  {t.cancel}
                </Button>
                <Button
                  type="submit"
                  disabled={createClient.isPending || updateClient.isPending}
                  className="rounded-xl shadow-md shadow-primary/20 w-full sm:w-auto"
                >
                  {(createClient.isPending || updateClient.isPending) && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {t.save}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {statCards.map((stat, i) => (
          <Card
            key={i}
            className="rounded-2xl border-border/50 shadow-sm hover:shadow-md transition-all duration-200"
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`p-2.5 rounded-xl ${stat.bg}`}>
                <stat.icon className={`h-4 w-4 sm:h-5 sm:w-5 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className={`text-xl sm:text-2xl font-bold font-mono ${stat.color}`}>
                {stat.value}
              </div>
              <p className="text-xs text-muted-foreground mt-1">{stat.subtext}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search & Filters Card */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-card p-3 sm:p-4 rounded-2xl border border-border/50 shadow-sm">
        <div className="flex items-center gap-3 flex-1 bg-muted/40 px-3 py-2 rounded-xl border border-border/40">
          <Search className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <Input
            placeholder={`${t.search} (${t.name}, ${t.company}, ${t.phone})...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border-none shadow-none focus-visible:ring-0 bg-transparent h-auto p-0 text-sm sm:text-base placeholder:text-muted-foreground/70"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Party Type Select */}
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[140px] sm:w-[160px] rounded-xl h-10">
              <SelectValue placeholder={t.clientType} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t.all} ({t.clientType})</SelectItem>
              <SelectItem value="customer">{t.customer}</SelectItem>
              <SelectItem value="supplier">{t.supplierType}</SelectItem>
              <SelectItem value="both">{t.bothType}</SelectItem>
            </SelectContent>
          </Select>

          {/* Balance Filter Select */}
          <Select value={balanceFilter} onValueChange={setBalanceFilter}>
            <SelectTrigger className="w-[140px] sm:w-[160px] rounded-xl h-10">
              <SelectValue placeholder={t.netBalance} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t.all} {t.netBalance}</SelectItem>
              <SelectItem value="receivable">{t.receivable}</SelectItem>
              <SelectItem value="payable">{t.payable}</SelectItem>
              <SelectItem value="settled">{t.settled}</SelectItem>
            </SelectContent>
          </Select>

          {/* Results Badge */}
          <Badge variant="secondary" className="h-10 px-3 rounded-xl font-mono text-xs">
            {filteredClients.length} {filteredClients.length === 1 ? "Party" : "Parties"}
          </Badge>
        </div>
      </div>

      {/* Clients Table */}
      <div className="rounded-2xl border border-border/50 overflow-hidden bg-card shadow-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead className="min-w-[200px]">{t.clientName}</TableHead>
                <TableHead className="min-w-[140px]">{t.company}</TableHead>
                <TableHead className="min-w-[140px]">{t.phone}</TableHead>
                <TableHead className="min-w-[110px]">{t.clientType}</TableHead>
                <TableHead className={`min-w-[160px] ${language === 'ur' ? 'text-left' : 'text-right'}`}>
                  {t.netBalance}
                </TableHead>
                <TableHead className="text-center min-w-[90px]">{t.status}</TableHead>
                <TableHead className={`min-w-[150px] ${language === 'ur' ? 'text-left' : 'text-right'}`}>
                  {t.actions}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Loader2 className="h-7 w-7 animate-spin text-primary" />
                      <span className="text-sm text-muted-foreground">{t.loading}</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredClients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-14 text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <Building2 className="h-12 w-12 text-muted-foreground/40" />
                      <p className="text-base font-medium">{t.noClientsFound}</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleOpenCreate}
                        className="rounded-xl gap-2 mt-1"
                      >
                        <Plus className="h-4 w-4" />
                        {t.addClient}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredClients.map((client) => {
                  const clientId = client.id || (client as any)._id;
                  const balance = client.netBalance || 0;
                  const initials = getInitials(client.name);

                  return (
                    <TableRow key={clientId} className="hover:bg-muted/30 transition-colors">
                      {/* Name + Avatar */}
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary font-bold text-xs flex items-center justify-center flex-shrink-0 border border-primary/20">
                            {initials || "CL"}
                          </div>
                          <div>
                            <Link href={`/clients/${clientId}`}>
                              <span className="font-semibold text-foreground hover:text-primary transition-colors cursor-pointer block">
                                {translateCustom(clientId, client.name)}
                              </span>
                            </Link>
                            {client.address && (
                              <span className="text-xs text-muted-foreground block truncate max-w-[200px]">
                                {translateCustom(clientId + '-addr', client.address)}
                              </span>
                            )}
                          </div>
                        </div>
                      </TableCell>

                      {/* Company */}
                      <TableCell className="text-muted-foreground text-sm font-medium">
                        {client.company ? translateCustom(clientId + '-comp', client.company) : "—"}
                      </TableCell>

                      {/* Phone */}
                      <TableCell className="text-muted-foreground font-mono text-xs">
                        {client.phone ? (
                          <div className="flex items-center gap-1.5 group">
                            <Phone className="h-3.5 w-3.5 text-muted-foreground/70" />
                            <a
                              href={`tel:${client.phone}`}
                              className="hover:underline hover:text-foreground"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {client.phone}
                            </a>
                            <button
                              type="button"
                              onClick={(e) => handleCopyPhone(client.phone!, e)}
                              className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Copy Phone"
                            >
                              {copiedPhone === client.phone ? (
                                <Check className="h-3 w-3 text-emerald-600" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </button>
                          </div>
                        ) : (
                          "—"
                        )}
                      </TableCell>

                      {/* Type Badge */}
                      <TableCell>{getTypeBadge(client.type)}</TableCell>

                      {/* Net Balance */}
                      <TableCell className={`font-mono font-bold text-sm ${language === 'ur' ? 'text-left' : 'text-right'}`}>
                        {balance > 0 ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-300 bg-emerald-100/70 dark:bg-emerald-950/40 px-2.5 py-1 rounded-xl text-xs">
                            <span className="font-bold">+Rs. {balance.toLocaleString()}</span>
                            <span className="text-[10px] opacity-80">({t.receivable})</span>
                          </span>
                        ) : balance < 0 ? (
                          <span className="inline-flex items-center gap-1 text-rose-700 dark:text-rose-300 bg-rose-100/70 dark:bg-rose-950/40 px-2.5 py-1 rounded-xl text-xs">
                            <span className="font-bold">-Rs. {Math.abs(balance).toLocaleString()}</span>
                            <span className="text-[10px] opacity-80">({t.payable})</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-muted-foreground bg-muted px-2.5 py-1 rounded-xl text-xs">
                            Rs. 0 ({t.settled})
                          </span>
                        )}
                      </TableCell>

                      {/* Status */}
                      <TableCell className="text-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            client.isActive !== false
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {client.isActive !== false ? t.active : t.inactive}
                        </span>
                      </TableCell>

                      {/* Actions */}
                      <TableCell className={language === 'ur' ? 'text-left' : 'text-right'}>
                        <div className={`flex items-center ${language === 'ur' ? 'justify-start' : 'justify-end'} gap-1.5`}>
                          <Link href={`/clients/${clientId}`}>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 gap-1.5 rounded-xl text-primary border-primary/30 hover:bg-primary/10 hover:text-primary font-medium text-xs shadow-none"
                            >
                              <BookOpen className="h-3.5 w-3.5" />
                              {t.ledger}
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-xl text-muted-foreground hover:text-foreground"
                            onClick={() => handleEdit(client)}
                            title={t.edit}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-xl text-destructive hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => handleDelete(clientId, client.name)}
                            title={t.delete}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
