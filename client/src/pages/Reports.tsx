import { useSales } from "@/hooks/use-sales";
import { useI18n } from "@/lib/i18n";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Download, CalendarIcon } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

type DateFilter = "all" | "daily" | "weekly" | "monthly" | "yearly" | "custom";

export default function Reports() {
  const { stats, isLoading, dateFilter, setDateFilter, customDateRange, setCustomDateRange } = useSales();
  const { t } = useI18n();
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  const handleDownload = () => {
    const getPeriodLabel = () => {
      if (dateFilter === "custom" && customDateRange?.from && customDateRange?.to) {
        return `${format(customDateRange.from, "MMM dd, yyyy")} - ${format(customDateRange.to, "MMM dd, yyyy")}`;
      }
      switch (dateFilter) {
        case "daily":
          return `Daily Report - ${format(new Date(), "MMM dd, yyyy")}`;
        case "weekly":
          return `Weekly Report - ${format(new Date(), "MMM dd, yyyy")}`;
        case "monthly":
          return `Monthly Report - ${format(new Date(), "MMMM yyyy")}`;
        case "yearly":
          return `Yearly Report - ${format(new Date(), "yyyy")}`;
        default:
          return "All Time Report";
      }
    };

    const reportData = {
      period: getPeriodLabel(),
      sales: stats?.dailySales || 0,
      purchases: stats?.dailyPurchases || 0,
      expenses: stats?.dailyExpenses || 0,
      profit: stats?.profit || 0,
      date: format(new Date(), "MMMM dd, yyyy 'at' hh:mm a"),
      chartData: stats?.weeklySales || [],
    };

    // Create comprehensive CSV report
    let csvContent = `Financial Report\n`;
    csvContent += `Period: ${reportData.period}\n`;
    csvContent += `Generated: ${reportData.date}\n`;
    csvContent += `\n`;
    csvContent += `SUMMARY\n`;
    csvContent += `--------\n`;
    csvContent += `Total Sales,Rs ${reportData.sales.toLocaleString()}\n`;
    csvContent += `Total Purchases,Rs ${reportData.purchases.toLocaleString()}\n`;
    csvContent += `Total Expenses,Rs ${reportData.expenses.toLocaleString()}\n`;
    csvContent += `Net Profit,Rs ${reportData.profit.toLocaleString()}\n`;
    csvContent += `\n`;

    if (reportData.chartData.length > 0) {
      csvContent += `DETAILED BREAKDOWN\n`;
      csvContent += `------------------\n`;
      csvContent += `Date,Amount\n`;
      reportData.chartData.forEach(item => {
        csvContent += `${item.date},Rs ${item.amount.toLocaleString()}\n`;
      });
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const fileName = `report-${dateFilter}-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-display font-bold">{t.reports}</h2>
          <p className="text-sm sm:text-base text-muted-foreground">Generate and download financial reports.</p>
        </div>
        <div className="flex gap-2 items-center">
          <Select value={dateFilter} onValueChange={(val: DateFilter) => setDateFilter(val)}>
            <SelectTrigger className="w-[150px] rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="daily">{t.daily}</SelectItem>
              <SelectItem value="weekly">{t.weekly}</SelectItem>
              <SelectItem value="monthly">{t.monthly}</SelectItem>
              <SelectItem value="yearly">Yearly</SelectItem>
              <SelectItem value="custom">{t.custom}</SelectItem>
            </SelectContent>
          </Select>
          {dateFilter === "custom" && (
            <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-[280px] justify-start text-left font-normal rounded-xl",
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
                  onSelect={(range) => {
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
          <Button onClick={handleDownload} className="rounded-xl" disabled={isLoading}>
            <Download className="mr-2 h-4 w-4" />
            {/* {t.downloadReport} */}
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Card className="rounded-2xl"><CardContent className="p-6"><div className="h-32 animate-pulse bg-muted" /></CardContent></Card>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <Card className="rounded-2xl border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">{t.totalSales}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-mono">Rs {stats?.dailySales.toLocaleString() ?? 0}</div>
            </CardContent>
          </Card>
          <Card className="rounded-2xl border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">{t.totalPurchases}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-mono">Rs {stats?.dailyPurchases.toLocaleString() ?? 0}</div>
            </CardContent>
          </Card>
          <Card className="rounded-2xl border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">{t.expenses}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-mono">Rs {stats?.dailyExpenses.toLocaleString() ?? 0}</div>
            </CardContent>
          </Card>
          <Card className="rounded-2xl border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">{t.netProfit}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold font-mono ${stats?.profit && stats.profit >= 0 ? "text-primary" : "text-destructive"}`}>
                Rs {stats?.profit.toLocaleString() ?? 0}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

