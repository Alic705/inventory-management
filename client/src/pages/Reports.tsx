import { useState } from "react";
import { useSales } from "@/hooks/use-sales";
import { usePurchases } from "@/hooks/use-purchases";
import { useExpenses } from "@/hooks/use-expenses";
import { useClients } from "@/hooks/use-clients";
import { useProducts } from "@/hooks/use-products";
import { useI18n } from "@/lib/i18n";
import { useTranslate } from "@/hooks/use-translate";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Download,
  CalendarIcon,
  Printer,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingBag,
  ShoppingCart,
  Receipt,
  Users,
  ArrowDownLeft,
  ArrowUpRight,
  Scale,
  FileSpreadsheet,
  PieChart,
  BarChart3,
  Building2,
  RefreshCw,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { DateRange } from "react-day-picker";

type DateFilter = "all" | "daily" | "weekly" | "monthly" | "yearly" | "custom";

export default function Reports() {
  const { stats, isLoading: isLoadingSales, dateFilter, setDateFilter, customDateRange, setCustomDateRange } = useSales();
  const { purchases, isLoading: isLoadingPurchases } = usePurchases();
  const { expenses, isLoading: isLoadingExpenses } = useExpenses("all");
  const { clients, isLoading: isLoadingClients } = useClients();
  const { products } = useProducts();
  const { t, language } = useI18n();
  const { translateProductName } = useTranslate();
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  const totalSales = stats?.dailySales ?? 0;
  const totalPurchases = stats?.dailyPurchases ?? 0;
  const totalExpenses = stats?.dailyExpenses ?? 0;
  const netProfit = stats?.profit ?? (totalSales - (totalPurchases + totalExpenses));

  // Party KPI calculations
  const totalReceivables = clients.reduce((sum, c) => {
    const bal = c.netBalance || 0;
    return bal > 0 ? sum + bal : sum;
  }, 0);

  const totalPayables = clients.reduce((sum, c) => {
    const bal = c.netBalance || 0;
    return bal < 0 ? sum + Math.abs(bal) : sum;
  }, 0);

  // Expense Categories calculation
  const expenseByCategory = (expenses || []).reduce((acc: Record<string, number>, exp) => {
    const cat = exp.category || "Other";
    acc[cat] = (acc[cat] || 0) + exp.amount;
    return acc;
  }, {});

  const expenseCategoryData = Object.keys(expenseByCategory).map((key) => ({
    name: key,
    value: expenseByCategory[key],
  }));

  const chartData = stats?.weeklySales.map((s) => ({
    name: s.date,
    sales: s.amount,
  })) ?? [];

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadCSV = () => {
    const periodLabel = dateFilter === "custom" && customDateRange?.from && customDateRange?.to
      ? `${format(customDateRange.from, "yyyy-MM-dd")}_to_${format(customDateRange.to, "yyyy-MM-dd")}`
      : dateFilter;

    let csvContent = `Project Fixer - Financial & Business Report\n`;
    csvContent += `Period: ${dateFilter.toUpperCase()}\n`;
    csvContent += `Generated On: ${format(new Date(), "yyyy-MM-dd hh:mm a")}\n\n`;

    // 1. Executive Summary
    csvContent += `EXECUTIVE FINANCIAL SUMMARY\n`;
    csvContent += `Total Sales Revenue,Rs ${totalSales.toLocaleString()}\n`;
    csvContent += `Total Stock Purchases,Rs ${totalPurchases.toLocaleString()}\n`;
    csvContent += `Total Operating Expenses,Rs ${totalExpenses.toLocaleString()}\n`;
    csvContent += `Net Profit / Loss,Rs ${netProfit.toLocaleString()}\n`;
    csvContent += `Customer Receivables (Pending Vasooli),Rs ${totalReceivables.toLocaleString()}\n`;
    csvContent += `Supplier Payables (Pending Adaigi),Rs ${totalPayables.toLocaleString()}\n\n`;

    // 2. Party Ledgers Summary
    csvContent += `PARTY LEDGERS & BALANCES SUMMARY\n`;
    csvContent += `Party Name,Company,Phone,Type,Opening Balance,Total Sales,Total Purchases,Total Received,Total Paid,Net Balance\n`;
    clients.forEach((c) => {
      csvContent += `"${c.name}","${c.company || ''}","${c.phone || ''}","${c.type}",${c.openingBalance || 0},${c.totalSales || 0},${c.totalPurchases || 0},${c.totalReceived || 0},${c.totalPaid || 0},${c.netBalance || 0}\n`;
    });
    csvContent += `\n`;

    // 3. Expenses Breakdown
    csvContent += `OPERATING EXPENSES BREAKDOWN\n`;
    csvContent += `Date,Category,Description,Amount\n`;
    (expenses || []).forEach((e) => {
      csvContent += `"${format(new Date(e.date), "yyyy-MM-dd")}","${e.category}","${e.description || ''}",${e.amount}\n`;
    });

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `report_${periodLabel}_${format(new Date(), "yyyyMMdd")}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

  const topStatCards = [
    {
      title: t.totalSales,
      value: `Rs ${totalSales.toLocaleString()}`,
      subtext: language === 'ur' ? 'کل فروخت کی رقم' : 'Total sales revenue',
      icon: ShoppingCart,
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-100 dark:bg-blue-900/20",
    },
    {
      title: t.totalPurchases,
      value: `Rs ${totalPurchases.toLocaleString()}`,
      subtext: language === 'ur' ? 'اسٹاک خریداری لاگت' : 'Stock purchase cost',
      icon: ShoppingBag,
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-100 dark:bg-amber-900/20",
    },
    {
      title: t.expenses,
      value: `Rs ${totalExpenses.toLocaleString()}`,
      subtext: language === 'ur' ? 'روزمرہ اخراجات' : 'Operating expenses',
      icon: TrendingDown,
      color: "text-orange-600 dark:text-orange-400",
      bg: "bg-orange-100 dark:bg-orange-900/20",
    },
    {
      title: t.netProfit,
      value: `Rs ${netProfit.toLocaleString()}`,
      subtext: netProfit >= 0
        ? (language === 'ur' ? 'خالص منافع' : 'Net positive profit')
        : (language === 'ur' ? 'خسارہ' : 'Operating loss'),
      icon: DollarSign,
      color: netProfit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-destructive",
      bg: netProfit >= 0 ? "bg-emerald-100 dark:bg-emerald-900/20" : "bg-destructive/10",
    },
    {
      title: t.receivable,
      value: `Rs ${totalReceivables.toLocaleString()}`,
      subtext: language === 'ur' ? 'گاہکوں سے وصول طلب' : 'From customers',
      icon: ArrowDownLeft,
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-100 dark:bg-emerald-900/20",
    },
    {
      title: t.payable,
      value: `Rs ${totalPayables.toLocaleString()}`,
      subtext: language === 'ur' ? 'سپلائرز کو واجب الادا' : 'To suppliers',
      icon: ArrowUpRight,
      color: "text-rose-600 dark:text-rose-400",
      bg: "bg-rose-100 dark:bg-rose-900/20",
    },
  ];

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-4 md:space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header & Controls Bar */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-display font-bold text-foreground">
            {t.reports}
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            {language === 'ur'
              ? 'مالیاتی رپورٹس، فروخت، خریداری، اخراجات اور کھاتوں کا مکمل تجزیہ۔'
              : 'Complete financial overview, sales, purchases, expenses & ledger reports.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          {/* Time Filter Select */}
          <Select value={dateFilter} onValueChange={(val: DateFilter) => setDateFilter(val)}>
            <SelectTrigger className="w-[140px] sm:w-[160px] rounded-xl h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t.allTime}</SelectItem>
              <SelectItem value="daily">{t.daily}</SelectItem>
              <SelectItem value="weekly">{t.weekly}</SelectItem>
              <SelectItem value="monthly">{t.monthly}</SelectItem>
              <SelectItem value="yearly">{t.yearly}</SelectItem>
              <SelectItem value="custom">{t.custom}</SelectItem>
            </SelectContent>
          </Select>

          {/* Custom Date Range Popover */}
          {dateFilter === "custom" && (
            <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-[240px] justify-start text-left font-normal rounded-xl h-10 text-xs sm:text-sm",
                    !customDateRange && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {customDateRange?.from ? (
                    customDateRange.to ? (
                      <>
                        {format(customDateRange.from, "LLL dd, y")} -{" "}
                        {format(customDateRange.to, "LLL dd, y")}
                      </>
                    ) : (
                      format(customDateRange.from, "LLL dd, y")
                    )
                  ) : (
                    <span>{t.selectDateRange}</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={customDateRange?.from}
                  selected={customDateRange}
                  onSelect={(range: DateRange | undefined) => {
                    setCustomDateRange(range);
                    if (range?.from && range?.to) {
                      setDatePickerOpen(false);
                    }
                  }}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
          )}

          {/* Download CSV */}
          <Button
            onClick={handleDownloadCSV}
            className="rounded-xl shadow-md shadow-primary/20 gap-1.5 h-10 text-xs sm:text-sm"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Export</span> CSV
          </Button>

          {/* Print */}
          <Button
            variant="outline"
            onClick={handlePrint}
            className="rounded-xl gap-1.5 h-10 text-xs sm:text-sm hidden sm:inline-flex"
          >
            <Printer className="h-4 w-4" />
            Print
          </Button>
        </div>
      </div>

      {/* 6 Top Financial KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
        {topStatCards.map((stat, i) => (
          <Card
            key={i}
            className="rounded-2xl border-border/50 shadow-sm hover:shadow-md transition-all duration-200"
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 px-4 pt-4">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-xl ${stat.bg}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className={`text-lg sm:text-xl font-bold font-mono ${stat.color}`}>
                {stat.value}
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                {stat.subtext}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Comprehensive Report Tabs */}
      <div className="rounded-2xl border border-border/50 overflow-hidden bg-card shadow-sm">
        <Tabs defaultValue="overview" className="w-full">
          <div className="border-b border-border/50 px-4 pt-3 pb-0 bg-muted/20">
            <TabsList className="grid grid-cols-2 sm:grid-cols-4 w-full h-auto p-1 bg-muted/60 rounded-xl gap-1">
              <TabsTrigger
                value="overview"
                className="rounded-lg gap-1.5 text-xs sm:text-sm py-2 data-[state=active]:bg-card data-[state=active]:shadow-sm"
              >
                <BarChart3 className="h-3.5 w-3.5" />
                <span>Financial Overview</span>
              </TabsTrigger>
              <TabsTrigger
                value="parties"
                className="rounded-lg gap-1.5 text-xs sm:text-sm py-2 data-[state=active]:bg-card data-[state=active]:shadow-sm"
              >
                <Users className="h-3.5 w-3.5" />
                <span>Party Ledgers</span>
                <span className="font-mono text-[11px] bg-primary/10 text-primary px-1.5 py-0.2 rounded-full">
                  {clients.length}
                </span>
              </TabsTrigger>
              <TabsTrigger
                value="expenses"
                className="rounded-lg gap-1.5 text-xs sm:text-sm py-2 data-[state=active]:bg-card data-[state=active]:shadow-sm"
              >
                <PieChart className="h-3.5 w-3.5" />
                <span>Expenses Breakdown</span>
                <span className="font-mono text-[11px] bg-orange-500/10 text-orange-600 px-1.5 py-0.2 rounded-full">
                  {expenses?.length || 0}
                </span>
              </TabsTrigger>
              <TabsTrigger
                value="purchases"
                className="rounded-lg gap-1.5 text-xs sm:text-sm py-2 data-[state=active]:bg-card data-[state=active]:shadow-sm"
              >
                <Receipt className="h-3.5 w-3.5" />
                <span>Stock Purchases</span>
                <span className="font-mono text-[11px] bg-amber-500/10 text-amber-600 px-1.5 py-0.2 rounded-full">
                  {purchases?.length || 0}
                </span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* TAB 1: FINANCIAL OVERVIEW & P&L */}
          <TabsContent value="overview" className="p-4 sm:p-6 space-y-6 m-0">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* P&L Statement Card */}
              <Card className="rounded-2xl border-border/50 shadow-sm bg-card lg:col-span-1">
                <CardHeader>
                  <CardTitle className="text-base font-bold font-display flex items-center gap-2">
                    <FileSpreadsheet className="h-4 w-4 text-primary" />
                    Income Statement (P&L)
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Period: {dateFilter.toUpperCase()}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-muted-foreground">Gross Sales Revenue:</span>
                      <span className="font-mono font-bold text-foreground">
                        Rs. {totalSales.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-muted-foreground">Less Stock Purchases:</span>
                      <span className="font-mono font-semibold text-amber-600">
                        - Rs. {totalPurchases.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-muted-foreground">Less Operating Costs:</span>
                      <span className="font-mono font-semibold text-orange-600">
                        - Rs. {totalExpenses.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-t-2 border-primary/30 text-base">
                      <span className="font-bold text-foreground">Net Operating Profit:</span>
                      <span className={`font-mono font-bold text-lg ${netProfit >= 0 ? "text-emerald-600" : "text-destructive"}`}>
                        {netProfit >= 0 ? "+" : ""}Rs. {netProfit.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="p-3 bg-muted/40 rounded-xl text-xs space-y-1">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Profit Margin:</span>
                      <span className="font-mono font-bold text-foreground">
                        {totalSales > 0 ? ((netProfit / totalSales) * 100).toFixed(1) : 0}%
                      </span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Expense to Sales:</span>
                      <span className="font-mono font-bold text-foreground">
                        {totalSales > 0 ? ((totalExpenses / totalSales) * 100).toFixed(1) : 0}%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Sales Trend Chart */}
              <Card className="rounded-2xl border-border/50 shadow-sm bg-card lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-base font-bold font-display flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    Sales Revenue Activity
                  </CardTitle>
                </CardHeader>
                <CardContent className="pl-0 sm:pl-2">
                  <div className="h-[260px] w-full">
                    {chartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" opacity={0.2} vertical={false} />
                          <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
                            dy={10}
                          />
                          <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
                            tickFormatter={(value) => `Rs${value}`}
                            width={65}
                          />
                          <Tooltip
                            cursor={{ fill: 'var(--muted)', opacity: 0.2 }}
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                          />
                          <Bar
                            dataKey="sales"
                            fill="hsl(var(--primary))"
                            radius={[6, 6, 0, 0]}
                            maxBarSize={45}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                        No sales recorded for this period.
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* TAB 2: PARTIES LEDGERS SUMMARY */}
          <TabsContent value="parties" className="m-0 p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow>
                    <TableHead className="min-w-[180px]">{t.clientName}</TableHead>
                    <TableHead className="min-w-[130px]">{t.company}</TableHead>
                    <TableHead className="min-w-[100px]">{t.clientType}</TableHead>
                    <TableHead className="text-right min-w-[110px]">{t.openingBalance}</TableHead>
                    <TableHead className="text-right min-w-[110px]">{t.totalSales}</TableHead>
                    <TableHead className="text-right min-w-[110px]">{t.totalPurchases}</TableHead>
                    <TableHead className="text-right min-w-[110px]">Received (In)</TableHead>
                    <TableHead className="text-right min-w-[110px]">Paid (Out)</TableHead>
                    <TableHead className="text-right min-w-[140px]">{t.netBalance}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clients.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-12 text-muted-foreground">
                        {t.noClientsFound}
                      </TableCell>
                    </TableRow>
                  ) : (
                    clients.map((c) => {
                      const balance = c.netBalance || 0;
                      return (
                        <TableRow key={c.id || (c as any)._id} className="hover:bg-muted/30 transition-colors">
                          <TableCell className="font-semibold text-foreground">
                            {c.name}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {c.company || "—"}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize text-xs font-normal">
                              {c.type}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-mono text-xs">
                            Rs. {(c.openingBalance || 0).toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right font-mono text-xs text-blue-600 dark:text-blue-400">
                            Rs. {(c.totalSales || 0).toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right font-mono text-xs text-amber-600 dark:text-amber-400">
                            Rs. {(c.totalPurchases || 0).toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right font-mono text-xs text-emerald-600 dark:text-emerald-400">
                            Rs. {(c.totalReceived || 0).toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right font-mono text-xs text-rose-600 dark:text-rose-400">
                            Rs. {(c.totalPaid || 0).toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right font-mono font-bold text-sm">
                            {balance > 0 ? (
                              <span className="text-emerald-600 dark:text-emerald-400">
                                +Rs. {balance.toLocaleString()}
                              </span>
                            ) : balance < 0 ? (
                              <span className="text-rose-600 dark:text-rose-400">
                                -Rs. {Math.abs(balance).toLocaleString()}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">Rs. 0</span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* TAB 3: EXPENSES BREAKDOWN */}
          <TabsContent value="expenses" className="p-4 sm:p-6 space-y-6 m-0">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Pie Chart Card */}
              <Card className="rounded-2xl border-border/50 shadow-sm bg-card lg:col-span-1">
                <CardHeader>
                  <CardTitle className="text-base font-bold font-display">
                    Category Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[220px] w-full flex items-center justify-center">
                    {expenseCategoryData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsPieChart>
                          <Pie
                            data={expenseCategoryData}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={75}
                            innerRadius={45}
                            paddingAngle={4}
                          >
                            {expenseCategoryData.map((_, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => `Rs ${Number(value).toLocaleString()}`} />
                        </RechartsPieChart>
                      </ResponsiveContainer>
                    ) : (
                      <p className="text-muted-foreground text-sm">No expenses recorded.</p>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {expenseCategoryData.map((cat, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs">
                        <div
                          className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                        />
                        <span className="truncate text-muted-foreground">{cat.name}:</span>
                        <span className="font-mono font-bold text-foreground ml-auto">
                          Rs. {cat.value.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Expenses Table */}
              <Card className="rounded-2xl border-border/50 shadow-sm bg-card lg:col-span-2 overflow-hidden">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-muted/30">
                      <TableRow>
                        <TableHead>{t.date}</TableHead>
                        <TableHead>{t.category}</TableHead>
                        <TableHead>{t.description}</TableHead>
                        <TableHead className="text-right">{t.amount}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {expenses?.map((e) => (
                        <TableRow key={e.id}>
                          <TableCell className="text-xs text-muted-foreground whitespace-nowrap font-mono">
                            {format(new Date(e.date), "yyyy-MM-dd")}
                          </TableCell>
                          <TableCell className="font-medium text-sm">
                            {e.category}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {e.description || "—"}
                          </TableCell>
                          <TableCell className="text-right font-mono font-bold text-sm text-destructive">
                            Rs. {e.amount.toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </Card>
            </div>
          </TabsContent>

          {/* TAB 4: STOCK PURCHASES */}
          <TabsContent value="purchases" className="m-0 p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow>
                    <TableHead>{t.date}</TableHead>
                    <TableHead>{t.product}</TableHead>
                    <TableHead>{t.supplier}</TableHead>
                    <TableHead>{t.quantity}</TableHead>
                    <TableHead>{t.rate}</TableHead>
                    <TableHead className="text-right">{t.totalAmount}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {purchases?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                        No purchases found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    purchases?.map((p) => {
                      const prodName = p.productId?.name || "Product Stock";
                      return (
                        <TableRow key={p.id}>
                          <TableCell className="text-xs text-muted-foreground whitespace-nowrap font-mono">
                            {format(new Date(p.date), "yyyy-MM-dd")}
                          </TableCell>
                          <TableCell className="font-semibold text-foreground">
                            {prodName}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {p.supplier || "—"}
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {p.quantity} {p.productId?.unit || "kg"}
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            Rs. {p.rate}
                          </TableCell>
                          <TableCell className="text-right font-mono font-bold text-base text-foreground">
                            Rs. {p.totalAmount.toLocaleString()}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
