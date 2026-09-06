import { useState } from "react";
import { useRoute, Link, Redirect } from "wouter";
import { useClientDetail, useClients } from "@/hooks/use-clients";
import { useUsers } from "@/hooks/use-users";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  ArrowLeft,
  Building2,
  Phone,
  Mail,
  MapPin,
  Calendar,
  CreditCard,
  PlusCircle,
  ArrowDownLeft,
  ArrowUpRight,
  TrendingUp,
  Receipt,
  ShoppingCart,
  DollarSign,
  Scale,
  Trash2,
  FileText,
  Filter,
  Loader2,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Pencil,
  Printer,
  Copy,
  Check,
  Plus,
  Wallet,
  Upload,
  Image as ImageIcon,
  Eye,
  X,
  UserCheck,
} from "lucide-react";
import type { PaymentMethod, ClientType, InsertClient } from "@shared/schema";

export default function ClientDetail() {
  const [, params] = useRoute("/clients/:id");
  const clientId = params?.id || "";

  const { user } = useAuth();
  const { users } = useUsers();
  const { t, language } = useI18n();
  const { updateClient } = useClients();

  // Time filter state
  const [filter, setFilter] = useState<string>("all");
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");

  const { summary, isLoading, refetch, recordPayment, deletePayment } = useClientDetail(
    clientId,
    filter,
    fromDate,
    toDate
  );

  // Record Payment Dialog State
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentType, setPaymentType] = useState<"in" | "out">("in");
  const [paymentAmount, setPaymentAmount] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [paymentRef, setPaymentRef] = useState<string>("");
  const [paymentNotes, setPaymentNotes] = useState<string>("");
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().split("T")[0]);

  // Conditional Payment Fields
  const [receivedBy, setReceivedBy] = useState<string>("");
  const [bankName, setBankName] = useState<string>("");
  const [chequeNumber, setChequeNumber] = useState<string>("");
  const [chequeDate, setChequeDate] = useState<string>("");
  const [receiptImage, setReceiptImage] = useState<string>("");
  const [chequeImage, setChequeImage] = useState<string>("");

  // Lightbox / Image Preview Modal
  const [previewImage, setPreviewImage] = useState<{ url: string; title: string } | null>(null);

  // Edit Client Dialog State
  const [editOpen, setEditOpen] = useState(false);
  const [editFormData, setEditFormData] = useState<InsertClient>({
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

  const [copiedPhone, setCopiedPhone] = useState<string | null>(null);

  // Admin Only Access Guard
  if (user && user.role !== "admin") {
    return <Redirect to="/" />;
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, field: "receipt" | "cheque") => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      alert("File size is too large. Please select an image under 8MB.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      if (field === "receipt") {
        setReceiptImage(reader.result as string);
      } else {
        setChequeImage(reader.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(paymentAmount);
    if (!amountNum || amountNum <= 0) return;

    recordPayment.mutate(
      {
        type: paymentType,
        amount: amountNum,
        paymentMethod: paymentMethod,
        reference: paymentRef,
        notes: paymentNotes,
        receivedBy: paymentMethod === "cash" ? receivedBy : undefined,
        bankName: (paymentMethod === "bank" || paymentMethod === "online" || paymentMethod === "cheque") ? bankName : undefined,
        chequeNumber: paymentMethod === "cheque" ? chequeNumber : undefined,
        chequeDate: paymentMethod === "cheque" && chequeDate ? new Date(chequeDate) : undefined,
        receiptImage: (paymentMethod === "bank" || paymentMethod === "online") ? receiptImage : undefined,
        chequeImage: paymentMethod === "cheque" ? chequeImage : undefined,
        date: paymentDate ? new Date(paymentDate) : new Date(),
      } as any,
      {
        onSuccess: () => {
          setPaymentOpen(false);
          setPaymentAmount("");
          setPaymentRef("");
          setPaymentNotes("");
          setReceivedBy("");
          setBankName("");
          setChequeNumber("");
          setChequeDate("");
          setReceiptImage("");
          setChequeImage("");
          setPaymentDate(new Date().toISOString().split("T")[0]);
        },
      }
    );
  };

  const handleDeletePayment = (paymentId: string) => {
    if (window.confirm(t.confirmDelete || "Are you sure you want to delete this payment record?")) {
      deletePayment.mutate(paymentId);
    }
  };

  const handleOpenEdit = () => {
    if (!summary?.client) return;
    const client = summary.client;
    setEditFormData({
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
    setEditOpen(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateClient.mutate(
      { id: clientId, ...editFormData },
      {
        onSuccess: () => {
          setEditOpen(false);
          refetch();
        },
      }
    );
  };

  const handleCopyPhone = (phone: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(phone);
    setCopiedPhone(phone);
    setTimeout(() => setCopiedPhone(null), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="h-[70vh] w-full flex flex-col items-center justify-center gap-3">
        <Loader2 className="h-9 w-9 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">{t.loading}</p>
      </div>
    );
  }

  if (!summary || !summary.client) {
    return (
      <div className="p-4 sm:p-6 md:p-8 space-y-4">
        <Link href="/clients">
          <Button variant="ghost" className="gap-2 rounded-xl">
            <ArrowLeft className="h-4 w-4" />
            {language === 'ur' ? 'تمام کلائنٹس پر واپس جائیں' : 'Back to Clients'}
          </Button>
        </Link>
        <Card className="p-12 text-center text-muted-foreground rounded-2xl border-border/50">
          <AlertCircle className="h-12 w-12 mx-auto text-destructive opacity-60 mb-3" />
          <h2 className="text-xl font-bold font-display text-foreground">
            {language === 'ur' ? 'کلائنٹ نہیں ملا' : 'Client Not Found'}
          </h2>
          <p className="text-sm mt-1">
            {language === 'ur'
              ? 'مطلوبہ کلائنٹ کا ریکارڈ موجود نہیں ہے۔'
              : 'The requested client could not be located in the database.'}
          </p>
        </Card>
      </div>
    );
  }

  const client = summary.client;
  const netBalance = summary.netBalance;

  const getInitials = (name: string) => {
    return name
      .trim()
      .split(" ")
      .map((part) => part[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

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

  const initials = getInitials(client.name);

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-4 md:space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Top Header & Action Bar */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div className="flex items-center gap-3 sm:gap-4">
          <Link href="/clients">
            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10 rounded-xl border-border/50 shadow-sm flex-shrink-0"
              title="Back to Clients"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>

          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary font-display font-bold text-base flex items-center justify-center border border-primary/20 flex-shrink-0">
              {initials || "CL"}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-2xl sm:text-3xl font-display font-bold text-foreground">
                  {client.name}
                </h2>
                {getTypeBadge(client.type)}
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    client.isActive !== false
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {client.isActive !== false ? t.active : t.inactive}
                </span>
              </div>
              {client.company && (
                <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-0.5">
                  <Building2 className="h-3.5 w-3.5 text-muted-foreground/70" />
                  {client.company}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          <Button
            variant="outline"
            onClick={handleOpenEdit}
            className="rounded-xl gap-1.5 h-10 border-border/60 text-xs sm:text-sm font-medium"
          >
            <Pencil className="h-4 w-4 text-muted-foreground" />
            {t.editClient}
          </Button>

          <Button
            variant="outline"
            onClick={handlePrint}
            className="rounded-xl gap-1.5 h-10 border-border/60 text-xs sm:text-sm font-medium hidden sm:inline-flex"
          >
            <Printer className="h-4 w-4 text-muted-foreground" />
            {language === 'ur' ? 'کھاتہ پرنٹ کریں' : 'Print Ledger'}
          </Button>

          <Button
            onClick={() => {
              setPaymentType(netBalance < 0 ? "out" : "in");
              setPaymentOpen(true);
            }}
            className="rounded-xl shadow-lg shadow-primary/25 gap-2 h-10 flex-1 lg:flex-none font-medium text-xs sm:text-sm"
          >
            <CreditCard className="h-4 w-4" />
            {t.recordPayment}
          </Button>
        </div>
      </div>

      {/* Client Profile Info Card */}
      <Card className="rounded-2xl border-border/50 shadow-sm bg-card overflow-hidden">
        <CardContent className="p-4 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            {/* Phone */}
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground block font-medium">{t.phone}</span>
              <div className="flex items-center gap-2 group font-mono font-medium text-foreground">
                <Phone className="h-4 w-4 text-primary flex-shrink-0" />
                {client.phone ? (
                  <>
                    <a href={`tel:${client.phone}`} className="hover:underline">
                      {client.phone}
                    </a>
                    <button
                      type="button"
                      onClick={(e) => handleCopyPhone(client.phone!, e)}
                      className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Copy"
                    >
                      {copiedPhone === client.phone ? (
                        <Check className="h-3 w-3 text-emerald-600" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </button>
                  </>
                ) : (
                  <span className="text-muted-foreground font-sans">—</span>
                )}
              </div>
            </div>

            {/* Address */}
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground block font-medium">{t.address}</span>
              <p className="font-medium text-foreground flex items-center gap-2 truncate">
                <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
                <span className="truncate">{client.address || "—"}</span>
              </p>
            </div>

            {/* Opening Balance */}
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground block font-medium">{t.openingBalance}</span>
              <p className="font-mono font-bold text-foreground flex items-center gap-2">
                <Wallet className="h-4 w-4 text-primary flex-shrink-0" />
                <span>Rs. {(client.openingBalance || 0).toLocaleString()}</span>
                <span className="text-[11px] font-normal text-muted-foreground font-sans">
                  ({(client.openingBalance || 0) >= 0 ? t.receivable : t.payable})
                </span>
              </p>
            </div>

            {/* Notes / Remarks */}
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground block font-medium">{t.notes}</span>
              <p className="text-muted-foreground text-sm truncate italic">
                {client.notes || "No special terms / notes."}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Financial Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {/* Total Sales */}
        <Card className="rounded-2xl border-border/50 shadow-sm hover:shadow-md transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
              {t.totalSales}
            </CardTitle>
            <div className="p-2.5 rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
              <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold font-mono text-foreground">
              Rs. {summary.totalSales.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {summary.salesCount} {t.salesHistory}
            </p>
          </CardContent>
        </Card>

        {/* Total Purchases */}
        <Card className="rounded-2xl border-border/50 shadow-sm hover:shadow-md transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
              {t.totalPurchases}
            </CardTitle>
            <div className="p-2.5 rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400">
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold font-mono text-foreground">
              Rs. {summary.totalPurchases.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {summary.purchasesCount} {t.purchasesHistory}
            </p>
          </CardContent>
        </Card>

        {/* Total Cleared / Paid */}
        <Card className="rounded-2xl border-border/50 shadow-sm hover:shadow-md transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
              {t.clearedAmount}
            </CardTitle>
            <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
              Rs. {summary.clearedAmount.toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground mt-1 flex flex-wrap items-center gap-1.5">
              <span>Recv: Rs. {summary.totalReceived.toLocaleString()}</span>
              <span>•</span>
              <span>Paid: Rs. {summary.totalPaid.toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>

        {/* Pending Net Balance */}
        <Card
          className={`rounded-2xl border-border/50 shadow-sm hover:shadow-md transition-all ${
            netBalance > 0
              ? "bg-emerald-50/30 dark:bg-emerald-950/20 border-emerald-500/30"
              : netBalance < 0
              ? "bg-rose-50/30 dark:bg-rose-950/20 border-rose-500/30"
              : ""
          }`}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
              {t.netBalance}
            </CardTitle>
            <div
              className={`p-2.5 rounded-xl ${
                netBalance > 0
                  ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
                  : netBalance < 0
                  ? "bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              <Scale className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div
              className={`text-xl sm:text-2xl font-bold font-mono ${
                netBalance > 0
                  ? "text-emerald-600 dark:text-emerald-400"
                  : netBalance < 0
                  ? "text-rose-600 dark:text-rose-400"
                  : "text-foreground"
              }`}
            >
              {netBalance > 0 ? "+" : ""}Rs. {Math.abs(netBalance).toLocaleString()}
            </div>
            <p className="text-xs font-semibold mt-1">
              {netBalance > 0 ? (
                <span className="text-emerald-600 dark:text-emerald-400">
                  ● {t.receivable} ({language === 'ur' ? 'گاہک نے رقم دینی ہے' : 'Client Owes You'})
                </span>
              ) : netBalance < 0 ? (
                <span className="text-rose-600 dark:text-rose-400">
                  ● {t.payable} ({language === 'ur' ? 'سپلائر کو رقم ادا کرنی ہے' : 'You Owe Client'})
                </span>
              ) : (
                <span className="text-muted-foreground">
                  ● {t.settled} ({language === 'ur' ? 'کھاتہ بے باق ہے' : 'All Clear'})
                </span>
              )}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Time Filter Bar */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 bg-card p-3 sm:p-4 rounded-2xl border border-border/50 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-primary flex-shrink-0" />
            <span className="text-xs sm:text-sm font-semibold text-foreground">
              {language === 'ur' ? 'مدت کا انتخاب:' : 'Time Range:'}
            </span>
          </div>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[140px] sm:w-[160px] rounded-xl h-9 text-xs sm:text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t.allTime}</SelectItem>
              <SelectItem value="today">{t.daily}</SelectItem>
              <SelectItem value="weekly">{t.weekly}</SelectItem>
              <SelectItem value="monthly">{t.monthly}</SelectItem>
              <SelectItem value="yearly">{t.yearly}</SelectItem>
              <SelectItem value="custom">{t.custom}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {filter === "custom" && (
          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground font-medium">{t.from}:</span>
              <Input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="h-9 w-36 text-xs rounded-xl font-mono"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground font-medium">{t.to}:</span>
              <Input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="h-9 w-36 text-xs rounded-xl font-mono"
              />
            </div>
          </div>
        )}

        <Button
          variant="ghost"
          size="sm"
          onClick={() => refetch()}
          className="rounded-xl gap-1.5 text-xs text-muted-foreground hover:text-foreground h-9"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          {language === 'ur' ? 'ریفریش کریں' : 'Refresh'}
        </Button>
      </div>

      {/* Tabs: Complete Ledger, Sales, Purchases, Payments */}
      <div className="rounded-2xl border border-border/50 overflow-hidden bg-card shadow-sm">
        <Tabs defaultValue="ledger" className="w-full">
          <div className="border-b border-border/50 px-4 pt-3 pb-0 bg-muted/20">
            <TabsList className="grid grid-cols-2 sm:grid-cols-4 w-full h-auto p-1 bg-muted/60 rounded-xl gap-1">
              <TabsTrigger
                value="ledger"
                className="rounded-lg gap-1.5 text-xs sm:text-sm py-2 data-[state=active]:bg-card data-[state=active]:shadow-sm"
              >
                <FileText className="h-3.5 w-3.5" />
                <span>{t.allTransactions}</span>
                <span className="font-mono text-[11px] bg-primary/10 text-primary px-1.5 py-0.2 rounded-full">
                  {summary.ledger.length}
                </span>
              </TabsTrigger>
              <TabsTrigger
                value="sales"
                className="rounded-lg gap-1.5 text-xs sm:text-sm py-2 data-[state=active]:bg-card data-[state=active]:shadow-sm"
              >
                <ShoppingCart className="h-3.5 w-3.5" />
                <span>{t.salesHistory}</span>
                <span className="font-mono text-[11px] bg-blue-500/10 text-blue-600 px-1.5 py-0.2 rounded-full">
                  {summary.sales.length}
                </span>
              </TabsTrigger>
              <TabsTrigger
                value="purchases"
                className="rounded-lg gap-1.5 text-xs sm:text-sm py-2 data-[state=active]:bg-card data-[state=active]:shadow-sm"
              >
                <Receipt className="h-3.5 w-3.5" />
                <span>{t.purchasesHistory}</span>
                <span className="font-mono text-[11px] bg-amber-500/10 text-amber-600 px-1.5 py-0.2 rounded-full">
                  {summary.purchases.length}
                </span>
              </TabsTrigger>
              <TabsTrigger
                value="payments"
                className="rounded-lg gap-1.5 text-xs sm:text-sm py-2 data-[state=active]:bg-card data-[state=active]:shadow-sm"
              >
                <CreditCard className="h-3.5 w-3.5" />
                <span>{t.paymentsHistory}</span>
                <span className="font-mono text-[11px] bg-emerald-500/10 text-emerald-600 px-1.5 py-0.2 rounded-full">
                  {summary.payments.length}
                </span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* TAB 1: ALL TRANSACTIONS (LEDGER STATEMENT) */}
          <TabsContent value="ledger" className="m-0 p-0">
            {summary.ledger.length === 0 ? (
              <div className="p-14 text-center text-muted-foreground space-y-2">
                <FileText className="h-10 w-10 mx-auto opacity-30 text-muted-foreground" />
                <p className="text-sm font-medium">{t.noTransactionsFound}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow>
                      <TableHead className="min-w-[130px]">{t.date}</TableHead>
                      <TableHead className="min-w-[120px]">{t.reference}</TableHead>
                      <TableHead className="min-w-[220px]">{t.description}</TableHead>
                      <TableHead className={`min-w-[130px] ${language === 'ur' ? 'text-left' : 'text-right'}`}>
                        {t.debit} ({language === 'ur' ? 'وصول طلب' : 'Debit'})
                      </TableHead>
                      <TableHead className={`min-w-[130px] ${language === 'ur' ? 'text-left' : 'text-right'}`}>
                        {t.credit} ({language === 'ur' ? 'ادا شدہ' : 'Credit'})
                      </TableHead>
                      <TableHead className={`min-w-[150px] ${language === 'ur' ? 'text-left' : 'text-right'}`}>
                        {t.runningBalance}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {summary.ledger.map((item, idx) => {
                      const itemDate = new Date(item.date).toLocaleDateString("en-PK", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      });

                      return (
                        <TableRow key={item.id || idx} className="hover:bg-muted/30 transition-colors">
                          <TableCell className="text-xs text-muted-foreground whitespace-nowrap font-mono">
                            {itemDate}
                          </TableCell>
                          <TableCell className="font-mono text-xs font-semibold text-primary">
                            {item.reference || "—"}
                          </TableCell>
                          <TableCell className="font-medium text-sm text-foreground">
                            {item.description}
                          </TableCell>
                          <TableCell className={`font-mono font-semibold text-blue-600 dark:text-blue-400 ${language === 'ur' ? 'text-left' : 'text-right'}`}>
                            {item.debit > 0 ? `Rs. ${item.debit.toLocaleString()}` : "—"}
                          </TableCell>
                          <TableCell className={`font-mono font-semibold text-emerald-600 dark:text-emerald-400 ${language === 'ur' ? 'text-left' : 'text-right'}`}>
                            {item.credit > 0 ? `Rs. ${item.credit.toLocaleString()}` : "—"}
                          </TableCell>
                          <TableCell className={`font-mono font-bold ${language === 'ur' ? 'text-left' : 'text-right'}`}>
                            <span
                              className={`inline-block px-2.5 py-1 rounded-xl text-xs ${
                                item.runningBalance > 0
                                  ? "bg-emerald-100/80 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                                  : item.runningBalance < 0
                                  ? "bg-rose-100/80 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300"
                                  : "bg-muted text-muted-foreground"
                              }`}
                            >
                              Rs. {item.runningBalance.toLocaleString()}
                            </span>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>

          {/* TAB 2: SALES INVOICES */}
          <TabsContent value="sales" className="m-0 p-0">
            {summary.sales.length === 0 ? (
              <div className="p-14 text-center text-muted-foreground space-y-2">
                <ShoppingCart className="h-10 w-10 mx-auto opacity-30 text-muted-foreground" />
                <p className="text-sm font-medium">{t.noTransactionsFound}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow>
                      <TableHead className="min-w-[130px]">{t.date}</TableHead>
                      <TableHead className="min-w-[120px]">Invoice #</TableHead>
                      <TableHead className="min-w-[280px]">Items Breakdown</TableHead>
                      <TableHead className={`min-w-[140px] ${language === 'ur' ? 'text-left' : 'text-right'}`}>
                        {t.totalAmount}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {summary.sales.map((sale: any) => {
                      const saleId = sale.id || sale._id?.toString();
                      const saleDate = new Date(sale.date).toLocaleDateString("en-PK", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      });

                      return (
                        <TableRow key={saleId} className="hover:bg-muted/30 transition-colors">
                          <TableCell className="text-xs text-muted-foreground whitespace-nowrap font-mono">
                            {saleDate}
                          </TableCell>
                          <TableCell className="font-mono text-xs font-bold text-primary">
                            #{saleId.slice(-6).toUpperCase()}
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1 max-w-lg">
                              {sale.items?.map((item: any, i: number) => (
                                <div
                                  key={i}
                                  className="text-xs text-muted-foreground flex items-center justify-between gap-4 bg-muted/30 px-2 py-1 rounded-lg"
                                >
                                  <span>
                                    • {item.productId?.name || "Product"} ({item.quantity} {item.productId?.unit || "kg"} @ Rs. {item.rate})
                                  </span>
                                  <span className="font-mono text-foreground font-semibold">
                                    Rs. {item.amount?.toLocaleString()}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell className={`text-right font-mono font-bold text-base text-foreground ${language === 'ur' ? 'text-left' : 'text-right'}`}>
                            Rs. {sale.totalAmount?.toLocaleString()}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>

          {/* TAB 3: PURCHASES */}
          <TabsContent value="purchases" className="m-0 p-0">
            {summary.purchases.length === 0 ? (
              <div className="p-14 text-center text-muted-foreground space-y-2">
                <Receipt className="h-10 w-10 mx-auto opacity-30 text-muted-foreground" />
                <p className="text-sm font-medium">{t.noTransactionsFound}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow>
                      <TableHead className="min-w-[130px]">{t.date}</TableHead>
                      <TableHead className="min-w-[160px]">{t.product}</TableHead>
                      <TableHead className="min-w-[110px]">{t.quantity}</TableHead>
                      <TableHead className="min-w-[110px]">{t.rate}</TableHead>
                      <TableHead className={`min-w-[140px] ${language === 'ur' ? 'text-left' : 'text-right'}`}>
                        {t.totalAmount}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {summary.purchases.map((purchase: any) => {
                      const pId = purchase.id || purchase._id?.toString();
                      const pDate = new Date(purchase.date).toLocaleDateString("en-PK", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      });

                      return (
                        <TableRow key={pId} className="hover:bg-muted/30 transition-colors">
                          <TableCell className="text-xs text-muted-foreground whitespace-nowrap font-mono">
                            {pDate}
                          </TableCell>
                          <TableCell className="font-semibold text-foreground">
                            {purchase.productId?.name || "Product Stock"}
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {purchase.quantity} {purchase.productId?.unit || "kg"}
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            Rs. {purchase.rate}
                          </TableCell>
                          <TableCell className={`font-mono font-bold text-base text-foreground ${language === 'ur' ? 'text-left' : 'text-right'}`}>
                            Rs. {purchase.totalAmount?.toLocaleString()}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>

          {/* TAB 4: PAYMENTS HISTORY */}
          <TabsContent value="payments" className="m-0 p-0">
            {summary.payments.length === 0 ? (
              <div className="p-14 text-center text-muted-foreground space-y-2">
                <CreditCard className="h-10 w-10 mx-auto opacity-30 text-muted-foreground" />
                <p className="text-sm font-medium">{t.noTransactionsFound}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow>
                      <TableHead className="min-w-[120px]">{t.date}</TableHead>
                      <TableHead className="min-w-[140px]">{t.paymentType}</TableHead>
                      <TableHead className="min-w-[120px]">{t.paymentMethod}</TableHead>
                      <TableHead className="min-w-[160px]">Details / Ref</TableHead>
                      <TableHead className="min-w-[140px]">{t.notes}</TableHead>
                      <TableHead className="min-w-[80px] text-center">Attachment</TableHead>
                      <TableHead className={`min-w-[130px] ${language === 'ur' ? 'text-left' : 'text-right'}`}>
                        {t.amount}
                      </TableHead>
                      <TableHead className={`min-w-[80px] ${language === 'ur' ? 'text-left' : 'text-right'}`}>
                        {t.actions}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {summary.payments.map((pm: any) => {
                      const pmId = pm.id || pm._id?.toString();
                      const isReceived = pm.type === "in";
                      const pmDate = new Date(pm.date).toLocaleDateString("en-PK", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      });

                      const hasAttachment = pm.receiptImage || pm.chequeImage;

                      return (
                        <TableRow key={pmId} className="hover:bg-muted/30 transition-colors">
                          <TableCell className="text-xs text-muted-foreground whitespace-nowrap font-mono">
                            {pmDate}
                          </TableCell>
                          <TableCell>
                            {isReceived ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
                                <ArrowDownLeft className="h-3 w-3" />
                                {t.paymentIn}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
                                <ArrowUpRight className="h-3 w-3" />
                                {t.paymentOut}
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="capitalize text-sm font-medium">
                            <Badge variant="outline" className="capitalize text-xs font-normal">
                              {pm.paymentMethod}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs">
                            <div className="space-y-0.5">
                              {pm.receivedBy && (
                                <span className="flex items-center gap-1 text-muted-foreground">
                                  <UserCheck className="h-3 w-3 text-primary" />
                                  By: <strong className="text-foreground">{pm.receivedBy}</strong>
                                </span>
                              )}
                              {pm.bankName && (
                                <span className="block font-medium text-foreground">
                                  {pm.bankName}
                                </span>
                              )}
                              {pm.chequeNumber && (
                                <span className="block font-mono text-muted-foreground">
                                  Cheque #: {pm.chequeNumber}
                                  {pm.chequeDate && ` (Due: ${new Date(pm.chequeDate).toLocaleDateString()})`}
                                </span>
                              )}
                              {pm.reference && (
                                <span className="font-mono text-muted-foreground block">
                                  Ref: {pm.reference}
                                </span>
                              )}
                              {!pm.receivedBy && !pm.bankName && !pm.chequeNumber && !pm.reference && "—"}
                            </div>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground max-w-xs truncate">
                            {pm.notes || "—"}
                          </TableCell>
                          <TableCell className="text-center">
                            {hasAttachment ? (
                              <button
                                type="button"
                                onClick={() =>
                                  setPreviewImage({
                                    url: pm.receiptImage || pm.chequeImage,
                                    title: pm.receiptImage ? "Payment Receipt / Slip" : "Cheque Attachment",
                                  })
                                }
                                className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-medium p-1 bg-primary/10 rounded-lg"
                                title="View Image"
                              >
                                <ImageIcon className="h-3.5 w-3.5" />
                                View
                              </button>
                            ) : (
                              <span className="text-xs text-muted-foreground/50">—</span>
                            )}
                          </TableCell>
                          <TableCell className={`font-mono font-bold text-base text-foreground ${language === 'ur' ? 'text-left' : 'text-right'}`}>
                            Rs. {pm.amount?.toLocaleString()}
                          </TableCell>
                          <TableCell className={language === 'ur' ? 'text-left' : 'text-right'}>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-xl text-destructive hover:bg-destructive/10 hover:text-destructive"
                              onClick={() => handleDeletePayment(pmId)}
                              title={t.delete}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Record Payment Dialog */}
      <Dialog open={paymentOpen} onOpenChange={setPaymentOpen}>
        <DialogContent className="sm:max-w-lg rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-display font-bold flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              {t.recordPayment}
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              {language === 'ur'
                ? 'گاہک سے رقم وصولی یا سپلائر کو ادائیگی کا ریکارڈ محفوظ کریں۔'
                : 'Record a payment to clear customer receivable or pay supplier balance.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleRecordPayment} className="space-y-4 pt-2">
            {/* Payment Type: 1 SINGLE ROW SIDE BY SIDE */}
            <div className="space-y-2">
              <Label>{t.paymentType} *</Label>
              <div className="flex flex-row gap-2.5 w-full">
                <Button
                  type="button"
                  variant={paymentType === "in" ? "default" : "outline"}
                  className={`flex-1 gap-1.5 h-11 rounded-xl font-semibold text-xs sm:text-sm transition-all border ${
                    paymentType === "in"
                      ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/25 border-emerald-600"
                      : "text-muted-foreground hover:bg-muted/50 border-border"
                  }`}
                  onClick={() => setPaymentType("in")}
                >
                  <ArrowDownLeft className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">{t.paymentIn}</span>
                </Button>
                <Button
                  type="button"
                  variant={paymentType === "out" ? "default" : "outline"}
                  className={`flex-1 gap-1.5 h-11 rounded-xl font-semibold text-xs sm:text-sm transition-all border ${
                    paymentType === "out"
                      ? "bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-600/25 border-red-600"
                      : "text-muted-foreground hover:bg-muted/50 border-border"
                  }`}
                  onClick={() => setPaymentType("out")}
                >
                  <ArrowUpRight className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">{t.paymentOut}</span>
                </Button>
              </div>
            </div>

            {/* Amount */}
            <div className="space-y-2">
              <Label htmlFor="payment-amount">{t.amount} (Rs.) *</Label>
              <Input
                id="payment-amount"
                type="number"
                step="any"
                min="1"
                placeholder="e.g. 5000"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                required
                className="font-mono text-lg font-bold rounded-xl"
              />
              {netBalance !== 0 && (
                <button
                  type="button"
                  onClick={() => setPaymentAmount(Math.abs(netBalance).toString())}
                  className="text-xs text-primary hover:underline font-medium block text-left"
                >
                  {language === 'ur'
                    ? `پوری بقایا رقم سیٹ کریں (Rs. ${Math.abs(netBalance).toLocaleString()})`
                    : `Clear Full Outstanding Balance (Rs. ${Math.abs(netBalance).toLocaleString()})`}
                </button>
              )}
            </div>

            {/* Payment Method + Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="payment-method">{t.paymentMethod}</Label>
                <Select
                  value={paymentMethod}
                  onValueChange={(val: PaymentMethod) => setPaymentMethod(val)}
                >
                  <SelectTrigger id="payment-method" className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">{t.cash} (Cash)</SelectItem>
                    <SelectItem value="bank">{t.bank} (Bank Transfer)</SelectItem>
                    <SelectItem value="online">{t.online} (EasyPaisa / JazzCash / Mobile)</SelectItem>
                    <SelectItem value="cheque">{t.cheque} (Cheque)</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="payment-date">{t.date}</Label>
                <Input
                  id="payment-date"
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="rounded-xl font-mono text-xs sm:text-sm"
                  required
                />
              </div>
            </div>

            {/* CONDITIONAL 1: CASH -> Person who received/handled cash */}
            {paymentMethod === "cash" && (
              <div className="space-y-2 bg-muted/30 p-3 rounded-xl border border-border/50">
                <Label htmlFor="received-by" className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <UserCheck className="h-3.5 w-3.5 text-primary" />
                  {paymentType === "in"
                    ? (language === 'ur' ? 'رقم کس نے وصول کی؟ (Admin / Staff / Manager)' : 'Cash Received By (Person Name / Staff)')
                    : (language === 'ur' ? 'رقم کس نے ادا کی؟ (Admin / Staff / Manager)' : 'Cash Paid By (Person Name / Staff)')}
                </Label>
                <div className="flex gap-2">
                  <Select
                    value={receivedBy}
                    onValueChange={(val) => setReceivedBy(val)}
                  >
                    <SelectTrigger className="rounded-xl flex-1 bg-card">
                      <SelectValue placeholder="Select Staff / Admin or enter below" />
                    </SelectTrigger>
                    <SelectContent>
                      {users?.map((u) => (
                        <SelectItem key={u.id} value={u.username}>
                          {u.username} ({u.role})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    id="received-by"
                    placeholder="Or type name..."
                    value={receivedBy}
                    onChange={(e) => setReceivedBy(e.target.value)}
                    className="rounded-xl flex-1 bg-card"
                  />
                </div>
              </div>
            )}

            {/* CONDITIONAL 2: BANK OR ONLINE -> Bank/Platform Name, Ref ID & Upload Receipt */}
            {(paymentMethod === "bank" || paymentMethod === "online") && (
              <div className="space-y-3 bg-muted/30 p-3 rounded-xl border border-border/50">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">
                      {paymentMethod === "online" ? "Wallet / App Name" : "Bank Name"}
                    </Label>
                    <Input
                      placeholder={paymentMethod === "online" ? "e.g. EasyPaisa / JazzCash / SadaPay" : "e.g. Meezan Bank / HBL / Allied"}
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      className="rounded-xl bg-card"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Transaction ID / Ref #</Label>
                    <Input
                      placeholder="e.g. TRX-982347 / Slip #"
                      value={paymentRef}
                      onChange={(e) => setPaymentRef(e.target.value)}
                      className="rounded-xl bg-card font-mono"
                    />
                  </div>
                </div>

                {/* Upload Receipt Image */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold flex items-center justify-between">
                    <span>Upload Receipt / Slip Photo (Optional)</span>
                    {receiptImage && (
                      <button
                        type="button"
                        onClick={() => setReceiptImage("")}
                        className="text-xs text-destructive hover:underline"
                      >
                        Remove Image
                      </button>
                    )}
                  </Label>
                  {receiptImage ? (
                    <div className="relative rounded-xl border border-border/60 overflow-hidden bg-card p-2 flex items-center gap-3">
                      <img
                        src={receiptImage}
                        alt="Receipt preview"
                        className="h-16 w-16 object-cover rounded-lg border"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-emerald-600 flex items-center gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Receipt Attached
                        </p>
                        <button
                          type="button"
                          onClick={() => setPreviewImage({ url: receiptImage, title: "Receipt Preview" })}
                          className="text-xs text-primary hover:underline font-medium mt-1 flex items-center gap-1"
                        >
                          <Eye className="h-3 w-3" /> Click to view large
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="relative border-2 border-dashed border-border/70 hover:border-primary/50 transition-colors rounded-xl p-3 text-center bg-card">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileUpload(e, "receipt")}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      />
                      <Upload className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
                      <p className="text-xs text-muted-foreground">
                        Click or drag to attach receipt/screenshot (PNG, JPG)
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* CONDITIONAL 3: CHEQUE -> Cheque #, Bank Name, Clearing Date & Cheque Image */}
            {paymentMethod === "cheque" && (
              <div className="space-y-3 bg-muted/30 p-3 rounded-xl border border-border/50">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Cheque # *</Label>
                    <Input
                      placeholder="e.g. CHQ-10492"
                      value={chequeNumber}
                      onChange={(e) => setChequeNumber(e.target.value)}
                      className="rounded-xl bg-card font-mono"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Bank Name</Label>
                    <Input
                      placeholder="e.g. Bank Alfalah"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      className="rounded-xl bg-card"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Clearing Date</Label>
                    <Input
                      type="date"
                      value={chequeDate}
                      onChange={(e) => setChequeDate(e.target.value)}
                      className="rounded-xl bg-card font-mono text-xs"
                    />
                  </div>
                </div>

                {/* Upload Cheque Image */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold flex items-center justify-between">
                    <span>Upload Cheque Photo (Optional)</span>
                    {chequeImage && (
                      <button
                        type="button"
                        onClick={() => setChequeImage("")}
                        className="text-xs text-destructive hover:underline"
                      >
                        Remove Image
                      </button>
                    )}
                  </Label>
                  {chequeImage ? (
                    <div className="relative rounded-xl border border-border/60 overflow-hidden bg-card p-2 flex items-center gap-3">
                      <img
                        src={chequeImage}
                        alt="Cheque preview"
                        className="h-16 w-16 object-cover rounded-lg border"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-emerald-600 flex items-center gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Cheque Photo Attached
                        </p>
                        <button
                          type="button"
                          onClick={() => setPreviewImage({ url: chequeImage, title: "Cheque Photo Preview" })}
                          className="text-xs text-primary hover:underline font-medium mt-1 flex items-center gap-1"
                        >
                          <Eye className="h-3 w-3" /> Click to view large
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="relative border-2 border-dashed border-border/70 hover:border-primary/50 transition-colors rounded-xl p-3 text-center bg-card">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileUpload(e, "cheque")}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      />
                      <Upload className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
                      <p className="text-xs text-muted-foreground">
                        Click or drag to attach cheque photo (PNG, JPG)
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* General Reference (if not Bank/Cheque) */}
            {paymentMethod !== "bank" && paymentMethod !== "online" && (
              <div className="space-y-2">
                <Label htmlFor="payment-ref">{t.reference}</Label>
                <Input
                  id="payment-ref"
                  placeholder="e.g. Slip #, Memo, Voucher #"
                  value={paymentRef}
                  onChange={(e) => setPaymentRef(e.target.value)}
                  className="rounded-xl"
                />
              </div>
            )}

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="payment-notes">{t.notes}</Label>
              <Input
                id="payment-notes"
                placeholder="Optional remarks or notes"
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
                className="rounded-xl"
              />
            </div>

            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-4 border-t">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setPaymentOpen(false)}
                className="rounded-xl w-full sm:w-auto"
              >
                {t.cancel}
              </Button>
              <Button
                type="submit"
                disabled={recordPayment.isPending}
                className="rounded-xl shadow-md shadow-primary/20 w-full sm:w-auto"
              >
                {recordPayment.isPending && (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                )}
                {t.save}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Lightbox Modal for Image Preview */}
      <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
        <DialogContent className="sm:max-w-2xl rounded-2xl p-4 overflow-hidden">
          <DialogHeader className="pb-2">
            <DialogTitle className="text-base font-bold flex items-center justify-between">
              <span>{previewImage?.title || "Image Preview"}</span>
            </DialogTitle>
          </DialogHeader>
          <div className="max-h-[75vh] overflow-auto flex items-center justify-center bg-muted/40 rounded-xl p-2">
            {previewImage && (
              <img
                src={previewImage.url}
                alt="Enlarged preview"
                className="max-h-[70vh] w-auto max-w-full object-contain rounded-lg shadow"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Client Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-[550px] rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-display font-bold">
              {t.editClient}
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              {language === 'ur'
                ? 'پارٹی کی معلومات اور رابطہ تفصیلات اپ ڈیٹ کریں۔'
                : 'Update party details and contact information.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleEditSubmit} className="space-y-4 mt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="edit-name">{t.clientName} *</Label>
                <Input
                  id="edit-name"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  className="rounded-xl"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-company">{t.company}</Label>
                <Input
                  id="edit-company"
                  value={editFormData.company || ""}
                  onChange={(e) => setEditFormData({ ...editFormData, company: e.target.value })}
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-phone">{t.phone}</Label>
                <Input
                  id="edit-phone"
                  value={editFormData.phone || ""}
                  onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                  className="rounded-xl font-mono"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-type">{t.clientType}</Label>
                <Select
                  value={editFormData.type}
                  onValueChange={(val: ClientType) => setEditFormData({ ...editFormData, type: val })}
                >
                  <SelectTrigger id="edit-type" className="rounded-xl">
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
                <Label htmlFor="edit-email">{t.email}</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editFormData.email || ""}
                  onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="edit-address">{t.address}</Label>
                <Input
                  id="edit-address"
                  value={editFormData.address || ""}
                  onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="edit-notes">{t.notes}</Label>
                <Input
                  id="edit-notes"
                  value={editFormData.notes || ""}
                  onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                  className="rounded-xl"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t">
              <Label htmlFor="edit-active" className="cursor-pointer font-medium">
                {t.status}: {editFormData.isActive !== false ? t.active : t.inactive}
              </Label>
              <Switch
                id="edit-active"
                checked={editFormData.isActive !== false}
                onCheckedChange={(checked) =>
                  setEditFormData({ ...editFormData, isActive: checked })
                }
              />
            </div>

            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setEditOpen(false)}
                className="rounded-xl w-full sm:w-auto"
              >
                {t.cancel}
              </Button>
              <Button
                type="submit"
                disabled={updateClient.isPending}
                className="rounded-xl shadow-md shadow-primary/20 w-full sm:w-auto"
              >
                {updateClient.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {t.save}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
