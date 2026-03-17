import React, { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Button } from "@/shared/components/ui/button";
import { Activity, Truck, ArrowDownToLine, ArrowUpFromLine, Search, RefreshCw } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import { DateRangePicker } from "@/shared/components/form/DateRangePicker";
import { startOfMonth, endOfMonth, format } from "date-fns";
import { overviewService } from "../services/overviewService";
import { toast } from "sonner";

export default function OverviewPage() {
  const [dateRange, setDateRange] = useState({
    from: new Date(),
    to: new Date(),
  });
  const [shift, setShift] = useState("semua");
  const [isLoading, setIsLoading] = useState(false);
  const [analytics, setAnalytics] = useState({
    totalTonnage: 0,
    totalRitase: 0,
    totalFinish: 0,
    totalInTransit: 0,
    chartData: [],
  });

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const startStr = dateRange?.from ? format(dateRange.from, "yyyy-MM-dd") : null;
      const endStr = dateRange?.to ? format(dateRange.to, "yyyy-MM-dd") : null;
      const result = await overviewService.getSummaryData(startStr, endStr, shift);
      if (result.success) {
        setAnalytics(result.analytics);
      }
    } catch (error) {
      toast.error("Gagal mengambil data ringkasan");
    } finally {
      setIsLoading(false);
    }
  }, [dateRange, shift]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Overview Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Ringkasan seluruh aktivitas operasi Pengeluaran (ROM) dan Penerimaan (SDJ).
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <DateRangePicker
            date={dateRange}
            setDate={setDateRange}
          />

          <Select value={shift} onValueChange={setShift}>
            <SelectTrigger className="w-full sm:w-[140px] bg-background">
              <SelectValue placeholder="Pilih Shift" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="semua">Semua Shift</SelectItem>
              <SelectItem value="1">Shift 1</SelectItem>
              <SelectItem value="2">Shift 2</SelectItem>
            </SelectContent>
          </Select>

          <Button 
            onClick={fetchData}
            disabled={isLoading}
            className="w-full sm:w-auto gap-2 shrink-0"
          >
            {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            Terapkan
          </Button>
        </div>
      </div>

      {/* Top Metric Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tonase Keluar/Masuk</CardTitle>
            <ArrowDownToLine className="w-4 h-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalTonnage} MT</div>
            <p className="text-xs text-muted-foreground mt-1 text-emerald-600 font-medium">
              Berdasarkan range tanggal terpilih
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Ritase</CardTitle>
            <Truck className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalRitase} Rit</div>
            <p className="text-xs text-muted-foreground mt-1">
              Ritase tercatat di sistem
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Selesai (FINISH)</CardTitle>
            <ArrowUpFromLine className="w-4 h-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalFinish} Rit</div>
            <p className="text-xs text-muted-foreground mt-1">
              Sudah terselesaikan
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dalam Perjalanan</CardTitle>
            <Activity className="w-4 h-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalInTransit} Rit</div>
            <p className="text-xs text-muted-foreground mt-1 text-amber-500">
              Menunggu konfirmasi kedatangan
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Tonase Comparison Chart */}
        <Card className="col-span-full lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Perbandingan Tonase (ROM vs SDJ)
            </CardTitle>
            <Activity className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="mt-4">
            <div className="h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="name"
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    yAxisId="left"
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${value}`}
                  />
                  <Tooltip cursor={{fill: 'transparent'}} />
                  <Legend />
                  <Bar
                    yAxisId="left"
                    dataKey="sdjTonase"
                    name="Penerimaan SDJ / ROM (MT)"
                    fill="#10b981"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Ritase Comparison */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Perbandingan Ritase Harian
            </CardTitle>
            <Activity className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="mt-4">
             <div className="h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="name"
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    yAxisId="left"
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip cursor={{fill: 'transparent'}} />
                  <Legend />
                  <Bar
                    yAxisId="left"
                    dataKey="sdjRitase"
                    name="Ritase Harian"
                    fill="#3b82f6"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
