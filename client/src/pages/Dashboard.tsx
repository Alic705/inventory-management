import { useSales } from "@/hooks/use-sales";
import type { DateFilter } from "@/hooks/use-sales";
import { useI18n } from "@/lib/i18n";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { TrendingUp, TrendingDown, DollarSign, ShoppingBag, CalendarIcon } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { DateRange } from "react-day-picker";

export default function Dashboard() {
  const { stats, isLoading, dateFilter, setDateFilter, customDateRange, setCustomDateRange } = useSales();
  const { t } = useI18n();
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  const chartData = stats?.weeklySales.map(s => ({
    name: s.date,
    sales: s.amount
  })) ?? [];

  if (isLoading) {
    return <div className="p-4 sm:p-6 md:p-8 space-y-6 md:space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 rounded-2xl" />)}
      </div>
      <Skeleton className="h-[250px] sm:h-[300px] md:h-96 rounded-2xl" />
    </div>;
  }

  const statCards = [
    {
      title: t.totalSales,
      value: `Rs ${stats?.dailySales.toLocaleString() ?? 0}`,
      icon: TrendingUp,
      color: "text-green-600",
      bg: "bg-green-100 dark:bg-green-900/20"
    },
    {
      title: t.totalPurchases,
      value: `Rs ${stats?.dailyPurchases.toLocaleString() ?? 0}`,
      icon: ShoppingBag,
      color: "text-blue-600",
      bg: "bg-blue-100 dark:bg-blue-900/20"
    },
    {
      title: t.expenses,
      value: `Rs ${stats?.dailyExpenses.toLocaleString() ?? 0}`,
      icon: TrendingDown,
      color: "text-orange-600",
      bg: "bg-orange-100 dark:bg-orange-900/20"
    },
    {
      title: t.netProfit,
      value: `Rs ${stats?.profit.toLocaleString() ?? 0}`,
      icon: DollarSign,
      color: stats?.profit && stats.profit >= 0 ? "text-primary" : "text-destructive",
      bg: "bg-primary/10"
    }
  ];

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-display font-bold">{t.dashboard}</h2>
          <p className="text-sm sm:text-base text-muted-foreground">{t.welcome}</p>
        </div>
        <div className="flex gap-2 items-center">
          <Select value={dateFilter} onValueChange={(val) => setDateFilter(val as any)}>
            <SelectTrigger className="w-[150px] rounded-xl">
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
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {statCards.map((stat, i) => (
          <Card key={i} className="rounded-2xl border-border/50 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-xl ${stat.bg}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold font-mono">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="rounded-2xl border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">
            {dateFilter === "daily" ? t.dailyOverview :
              dateFilter === "weekly" ? t.weeklyOverviewTitle :
                dateFilter === "monthly" ? t.monthlyOverview :
                  dateFilter === "yearly" ? t.yearlyOverview :
                    dateFilter === "custom" && customDateRange?.from && customDateRange?.to ?
                      `${t.customOverview} (${format(customDateRange.from, "MMM dd")} - ${format(customDateRange.to, "MMM dd")})` :
                      t.salesOverview}
          </CardTitle>
        </CardHeader>
        <CardContent className="pl-0 sm:pl-2">
          <div className="h-[250px] sm:h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} vertical={false} />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }}
                  tickFormatter={(value) => `Rs${value}`}
                  width={50}
                />
                <Tooltip
                  cursor={{ fill: 'var(--muted)', opacity: 0.2 }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Bar
                  dataKey="sales"
                  fill="hsl(var(--primary))"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={50}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
