import React, { useState, useMemo } from "react";
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
import { Input } from "@/shared/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { BarChart3, TrendingUp, Filter, Calculator } from "lucide-react";
import ReactECharts from "echarts-for-react";
import {
  startOfMonth,
  endOfMonth,
  format,
  eachDayOfInterval,
  isBefore,
  isEqual,
  startOfDay,
  endOfDay,
  isAfter,
} from "date-fns";

const TonnageTimeChart = ({
  shipments = [],
  timeData = [],

  startDate,
  endDate,

  isLoading = false,

  chartView = "daily",
  onChartViewChange,

  selectedSource = "",
  selectedDestination = "",
  onSourceChange,
  onDestinationChange,
  showFilters = true,
  customEmptyState,
}) => {
  const [monthlyTarget, setMonthlyTarget] = useState("0");
  const [dailyTarget, setDailyTarget] = useState("0");
  const [targetMode, setTargetMode] = useState("daily");
  const [showPrognosisTable, setShowPrognosisTable] = useState(true);

  const filterOptions = useMemo(() => {
    const sources = [
      ...new Set(
        shipments
          .map((s) => s?.source)
          .filter(Boolean)
          .filter((v) => typeof v === "string"),
      ),
    ];
    const destinations = [
      ...new Set(
        shipments
          .map((s) => s?.destination)
          .filter(Boolean)
          .filter((v) => typeof v === "string"),
      ),
    ];
    return {
      sources: sources.sort(),
      destinations: destinations.sort(),
    };
  }, [shipments]);

  const LoadingSkeleton = () => (
    <div className="animate-pulse space-y-4">
      <div className="h-6 bg-muted rounded w-1/2 mx-auto"></div>
      <div className="h-[300px] sm:h-[400px] bg-muted rounded"></div>
    </div>
  );

  const generateTimeDataFromShipments = (shipments, view) => {
    const timeMap = new Map();

    shipments.forEach((shipment) => {
      if (!shipment) return;

      let date;
      if (shipment.date_shift && shipment.weighed_at) {
        date = new Date(
          `${shipment.date_shift.split("T")[0]}T${shipment.weighed_at}`,
        );
      } else if (shipment.date_shift) {
        date = new Date(shipment.date_shift);
      } else if (shipment.createdAt) {
        // Fallback terakhir jika date_shift kosong
        date = new Date(shipment.createdAt);
      }

      if (!date || isNaN(date.getTime())) return;

      const logicalDate = date;

      if (startDate && logicalDate < startOfDay(new Date(startDate))) return;
      if (endDate && logicalDate > endOfDay(new Date(endDate))) return;

      let timeKey;

      if (view === "hourly") {
        timeKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
          2,
          "0",
        )}-${String(date.getDate()).padStart(2, "0")}T${String(
          date.getHours(),
        ).padStart(2, "0")}:00:00`;
      } else {
        timeKey = format(date, "yyyy-MM-dd");
      }

      if (!timeMap.has(timeKey)) {
        timeMap.set(timeKey, {
          time: timeKey,
          date: timeKey,
          tonnage: 0,
          crushed: 0,
          uncrushed: 0,
          count: 0,
        });
      }

      const netWeight = parseFloat(
        shipment.net_weight || shipment.net_weight_slr || 0,
      );
      const coalType = shipment.coal_type?.toLowerCase();

      timeMap.get(timeKey).tonnage += netWeight;
      timeMap.get(timeKey).count += 1;

      if (coalType === "crushed") {
        timeMap.get(timeKey).crushed += netWeight;
      } else if (coalType === "uncrushed") {
        timeMap.get(timeKey).uncrushed += netWeight;
      }
    });

    return Array.from(timeMap.values()).sort(
      (a, b) => new Date(a.time) - new Date(b.time),
    );
  };

  const filteredTimeData = useMemo(() => {
    const isAllSource = !selectedSource || selectedSource === "ALL";
    const isAllDestination =
      !selectedDestination || selectedDestination === "ALL";

    if (
      isAllSource &&
      isAllDestination &&
      timeData.length > 0
    ) {
      if (chartView === "hourly") {
        const base = startDate ? new Date(startDate) : new Date();
        const shiftStart = new Date(base);
        shiftStart.setHours(6, 0, 0, 0);
        const shiftEnd = new Date(shiftStart);
        shiftEnd.setDate(shiftEnd.getDate() + 1);
        shiftEnd.setHours(5, 59, 59, 999);

        return timeData.filter((item) => {
          const itemDate = new Date(item.time || item.date);
          if (isNaN(itemDate.getTime())) return false;
          return itemDate >= shiftStart && itemDate <= shiftEnd;
        });
      }

      return timeData.filter((item) => {
        const itemDate = new Date(item.time || item.date);
        if (startDate && itemDate < startOfDay(new Date(startDate)))
          return false;
        if (endDate && itemDate > endOfDay(new Date(endDate))) return false;
        return true;
      });
    }

    const filteredShipments = shipments.filter((shipment) => {
      if (!shipment) return false;

      const matchesSource = isAllSource || shipment.source === selectedSource;
      const matchesDestination =
        isAllDestination || shipment.destination === selectedDestination;
      return matchesSource && matchesDestination;
    });

    return generateTimeDataFromShipments(filteredShipments, chartView);
  }, [
    timeData,
    shipments,
    selectedSource,
    selectedDestination,
    chartView,
    startDate,
    endDate,
  ]);

  const calculatePrognosis = () => {
    const baseStart = startDate
      ? new Date(startDate)
      : startOfMonth(new Date());
    const baseEnd = endDate ? new Date(endDate) : endOfMonth(new Date());

    const daysInRange = eachDayOfInterval({
      start: baseStart,
      end: baseEnd,
    });
    const today = startOfDay(new Date());

    // Hitung prognosa harian dan target berdasarkan mode
    let dailyPrognosis = 0;
    let monthlyTargetNum = 0;
    const totalDaysInRange = daysInRange.length;

    if (targetMode === "period") {
      // Mode Target Periode: target bulanan dibagi jumlah hari
      monthlyTargetNum = Number(monthlyTarget) || 0;
      dailyPrognosis =
        totalDaysInRange > 0 ? monthlyTargetNum / totalDaysInRange : 0;
    } else {
      // Mode Target Harian: prognosa harian dikali jumlah hari
      dailyPrognosis = Number(dailyTarget) || 0;
      monthlyTargetNum = dailyPrognosis * totalDaysInRange;
    }

    let totalRealization = 0;
    let totalPrognosis = 0;
    let runningCumulative = 0;

    const prognosisData = daysInRange.map((date) => {
      const dateStr = format(date, "yyyy-MM-dd");
      const dateOnly = startOfDay(date);

      const actualData = filteredTimeData.find((d) => {
        const s = d.time || d.date;
        return typeof s === "string" && s.startsWith(dateStr);
      });
      const tonnage = actualData ? actualData.tonnage || 0 : 0;

      const isPastDay = isBefore(dateOnly, today);
      const isTodayDay = isEqual(dateOnly, today);
      const isFutureDay = isAfter(dateOnly, today);

      if (isPastDay) {
        totalRealization += tonnage;
        runningCumulative += tonnage;
        return {
          date: dateStr,
          realization: tonnage,
          prognosis: null,
          cumulative: runningCumulative,
        };
      }

      if (isTodayDay) {
        const remaining = Math.max(dailyPrognosis - tonnage, 0);
        totalRealization += tonnage;
        totalPrognosis += remaining;
        runningCumulative += tonnage + remaining;
        return {
          date: dateStr,
          realization: tonnage || null,
          prognosis: remaining || null,
          cumulative: runningCumulative,
        };
      }

      if (isFutureDay) {
        totalPrognosis += dailyPrognosis;
        runningCumulative += dailyPrognosis;
        return {
          date: dateStr,
          realization: null,
          prognosis: dailyPrognosis,
          cumulative: runningCumulative,
        };
      }

      return {
        date: dateStr,
        realization: tonnage || null,
        prognosis: null,
        cumulative: runningCumulative,
      };
    });

    const projectedTotal = totalRealization + totalPrognosis;
    const variance = projectedTotal - monthlyTargetNum;

    return {
      data: prognosisData,
      summary: {
        totalRealization,
        totalPrognosis,
        projectedTotal,
        monthlyTarget: monthlyTargetNum,
        dailyPrognosis,
        totalDays: totalDaysInRange,
        variance,
        periodStart: format(baseStart, "dd/MM/yyyy"),
        periodEnd: format(baseEnd, "dd/MM/yyyy"),
      },
    };
  };

  const prognosisResult = calculatePrognosis();

  // Total ritase dari semua data yang difilter
  const totalRitase = useMemo(
    () => filteredTimeData.reduce((sum, item) => sum + (item.count || 0), 0),
    [filteredTimeData],
  );

  // Total tonase keseluruhan
  const totalTonase = useMemo(
    () => filteredTimeData.reduce((sum, item) => sum + (item.tonnage || 0), 0),
    [filteredTimeData],
  );

  const formatChartData = () => {
    if (chartView === "hourly") {
      return filteredTimeData.map((item) => ({
        time: item.time || item.date,
        tonnage: item.tonnage || 0,
        crushed: item.crushed || 0,
        uncrushed: item.uncrushed || 0,
        count: item.count || 0,
      }));
    } else {
      return filteredTimeData.map((item) => {
        let dateStr;
        try {
          const rawDate = item.time || item.date;
          if (!rawDate) {
            dateStr = "Invalid Date";
          } else if (typeof rawDate === "string") {
            dateStr = rawDate.split("T")[0];
          } else {
            dateStr = format(new Date(rawDate), "yyyy-MM-dd");
          }
        } catch (error) {
          console.error("Error parsing date:", item, error);
          dateStr = "Invalid Date";
        }

        return {
          time: dateStr,
          tonnage: item.tonnage || 0,
          crushed: item.crushed || 0,
          uncrushed: item.uncrushed || 0,
          count: item.count || 0,
        };
      });
    }
  };

  const chartData = formatChartData();

  const combinedChartData = useMemo(() => {
    const baseStart = startDate
      ? new Date(startDate)
      : startOfMonth(new Date());

    const baseEnd = endDate ? new Date(endDate) : endOfMonth(new Date());

    if (chartView === "hourly") {
      const hoursData = [];
      const shiftStart = new Date(baseStart);
      shiftStart.setHours(6, 0, 0, 0);
      const shiftEnd = new Date(shiftStart);
      shiftEnd.setDate(shiftEnd.getDate() + 1);
      shiftEnd.setHours(5, 0, 0, 0);
      const current = new Date(shiftStart);

      while (current <= shiftEnd) {
        const timeKey = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, "0")}-${String(current.getDate()).padStart(2, "0")}T${String(current.getHours()).padStart(2, "0")}:00:00`;
        const existingData = chartData.find((d) => d.time === timeKey);

        hoursData.push({
          time: timeKey,
          tonnage: existingData?.tonnage || 0,
          crushed: existingData?.crushed || 0,
          uncrushed: existingData?.uncrushed || 0,
          count: existingData?.count || 0,
        });

        current.setHours(current.getHours() + 1);
      }
      return hoursData;
    }

    const allDays = eachDayOfInterval({ start: baseStart, end: baseEnd });

    return allDays.map((date) => {
      const dateStr = format(date, "yyyy-MM-dd");
      const existingData = chartData.find((d) => d.time === dateStr);
      const progRow = prognosisResult.data.find((d) => d.date === dateStr);

      return {
        time: dateStr,
        tonnage: existingData?.tonnage || 0,
        crushed: existingData?.crushed || 0,
        uncrushed: existingData?.uncrushed || 0,
        count: existingData?.count || 0,
        prognosis: progRow?.prognosis || null,
        cumulative: progRow?.cumulative || 0,
      };
    });
  }, [chartData, prognosisResult, chartView, startDate, endDate]);

  const finalChartData = combinedChartData;

  // Detect dark mode
  const isDarkMode = document.documentElement.classList.contains("dark");
  const textColor = isDarkMode ? "#e5e7eb" : "#374151";
  const titleColor = isDarkMode ? "#f3f4f6" : "#374151";

  const chartOptions = {
    title: {
      text:
        chartView === "hourly"
          ? "Tonnase per Jam"
          : "Tonase dan Prognosa per Hari",
      left: "center",
      top: 0,
      textStyle: {
        fontSize: 16,
        fontWeight: "normal",
        color: titleColor,
      },
    },
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "shadow" },
      confine: true,
      borderWidth: 0,
      backgroundColor: isDarkMode ? "rgba(31, 41, 55, 0.95)" : "#111827",
      textStyle: { color: isDarkMode ? "#f3f4f6" : "#f9fafb" },
      formatter: (params) => {
        const timeLabel = chartView === "hourly" ? "Jam" : "Tanggal";
        const time = params[0]?.axisValue || "";
        const formatXAxisLabel = (value) => {
          if (chartView === "hourly") {
            const h = String(value).split("T")[1]?.slice(0, 2) ?? String(value);
            return `${h}:00`;
          }
          try {
            const [y, m, d] = String(value).split("T")[0].split("-");
            return `${d}/${m}/${y}`;
          } catch {
            return String(value);
          }
        };

        // Lookup ritase (count) dari finalChartData berdasarkan time key
        const dataPoint = finalChartData.find((d) => d.time === time);
        const ritase = dataPoint?.count || 0;

        let tooltipText = `${timeLabel}: ${formatXAxisLabel(time)}<br/>`;
        params.forEach((p) => {
          if (p.value !== null && p.value !== undefined) {
            tooltipText += `${p.seriesName}: ${Number(p.value).toLocaleString(
              "id-ID",
            )} ton<br/>`;
          }
        });
        // Tambahkan ritase di bawah info tonase
        if (ritase > 0) {
          tooltipText += `<span style="color:#34d399;font-weight:600">Ritase: ${ritase.toLocaleString("id-ID")} ritase</span>`;
        }
        return tooltipText;
      },
    },
    legend: {
      data:
        chartView === "daily"
          ? ["Realisasi", "Crushed", "Uncrushed", "Prognosa", "Kumulatif"]
          : ["Total", "Crushed", "Uncrushed"],
      bottom: 0,
      textStyle: {
        color: textColor,
      },
    },
    grid: {
      left: "3%",
      right: "4%",
      bottom: "15%",
      top: "15%",
      containLabel: true,
    },
    xAxis: {
      type: "category",
      data: finalChartData.map((item) => item.time),
      axisLabel: {
        formatter: (value) => {
          if (chartView === "hourly") {
            const h = String(value).split("T")[1]?.slice(0, 2) ?? String(value);
            return `${h}:00`;
          }
          try {
            const [y, m, d] = String(value).split("T")[0].split("-");
            return `${d}/${m}/${y}`;
          } catch {
            return String(value);
          }
        },
        rotate: chartView === "hourly" ? 0 : 30,
        interval: 0,
        color: textColor,
      },
      axisLine: {
        lineStyle: {
          color: isDarkMode ? "#4b5563" : "#e5e7eb",
        },
      },
    },
    yAxis: [
      {
        type: "value",
        name: "Tonnase (Ton)",
        position: "left",
        nameTextStyle: {
          color: textColor,
        },
        axisLabel: {
          formatter: (v) => v.toLocaleString("id-ID"),
          color: textColor,
        },
        axisLine: {
          lineStyle: {
            color: isDarkMode ? "#4b5563" : "#e5e7eb",
          },
        },
        splitLine: {
          lineStyle: {
            color: isDarkMode ? "#374151" : "#e5e7eb",
          },
        },
      },
      {
        type: "value",
        name: "Kumulatif (Ton)",
        position: "right",
        nameTextStyle: {
          color: textColor,
        },
        axisLabel: {
          formatter: (v) => v.toLocaleString("id-ID"),
          color: textColor,
        },
        axisLine: {
          lineStyle: {
            color: isDarkMode ? "#4b5563" : "#e5e7eb",
          },
        },
        splitLine: { show: false },
      },
    ],
    series:
      chartView === "daily"
        ? [
            {
              name: "Realisasi",
              type: "bar",
              data: finalChartData.map((item) => item.tonnage || null),
              itemStyle: { color: isDarkMode ? "#60a5fa" : "#3b82f6" },
            },
            {
              name: "Crushed",
              type: "bar",
              stack: "coal",
              data: finalChartData.map((item) => item.crushed || null),
              itemStyle: { color: isDarkMode ? "#34d399" : "#10b981" },
            },
            {
              name: "Uncrushed",
              type: "bar",
              stack: "coal",
              data: finalChartData.map((item) => item.uncrushed || null),
              itemStyle: { color: isDarkMode ? "#fbbf24" : "#f59e0b" },
            },
            {
              name: "Prognosa",
              type: "bar",
              data: finalChartData.map((item) => item.prognosis),
              itemStyle: {
                color: isDarkMode ? "#9ca3af" : "#6b7280",
                opacity: 0.7,
              },
            },
            {
              name: "Kumulatif",
              type: "line",
              yAxisIndex: 1,
              smooth: true,
              data: finalChartData.map((item) => item.cumulative),
              lineStyle: {
                width: 3,
                color: isDarkMode ? "#f87171" : "#ef4444",
              },
              itemStyle: { color: isDarkMode ? "#f87171" : "#ef4444" },
            },
          ]
        : [
            {
              name: "Total",
              type: "line",
              smooth: true,
              data: finalChartData.map((item) => item.tonnage),
              lineStyle: {
                width: 3,
                color: isDarkMode ? "#60a5fa" : "#3b82f6",
              },
              itemStyle: { color: isDarkMode ? "#60a5fa" : "#3b82f6" },
            },
            {
              name: "Crushed",
              type: "bar",
              stack: "total",
              data: finalChartData.map((item) => item.crushed || null),
              itemStyle: { color: isDarkMode ? "#34d399" : "#10b981" },
            },
            {
              name: "Uncrushed",
              type: "bar",
              stack: "total",
              data: finalChartData.map((item) => item.uncrushed || null),
              itemStyle: { color: isDarkMode ? "#fbbf24" : "#f59e0b" },
            },
          ],
  };

  const EmptyState =
    customEmptyState ||
    (() => (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <div className="text-center">
          <TrendingUp className="w-12 h-12 mx-auto mb-2 text-muted" />
          <p>No tonnage data available</p>
        </div>
      </div>
    ));

  return (
    <Card className="overflow-hidden">
      <CardHeader className="space-y-0 pb-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <CardTitle className="flex items-center space-x-2 text-foreground">
            <BarChart3 className="w-5 h-5 text-primary" />
            <span>Grafik Tonnase & Prognosa</span>
            {(selectedSource || selectedDestination) && (
              <span className="text-sm text-primary bg-primary/10 px-2 py-1 rounded-full">
                Filtered
              </span>
            )}
            {startDate && endDate && (
              <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                {format(new Date(startDate), "dd/MM")} -{" "}
                {format(new Date(endDate), "dd/MM")}
              </span>
            )}
          </CardTitle>

          <div className="flex flex-col md:flex-row gap-2 items-center">
            {showFilters && (
              <>
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Filter:</span>
                </div>

                <Select value={selectedSource} onValueChange={onSourceChange}>
                  <SelectTrigger className="w-32 bg-background">
                    <SelectValue placeholder="All Sources" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Sources</SelectItem>
                    {filterOptions.sources.map((source) => (
                      <SelectItem key={source} value={source}>
                        {source}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={selectedDestination}
                  onValueChange={onDestinationChange}
                >
                  <SelectTrigger className="w-32 bg-background">
                    <SelectValue placeholder="All Destinations" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Destinations</SelectItem>
                    {filterOptions.destinations.map((destination) => (
                      <SelectItem key={destination} value={destination}>
                        {destination}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </>
            )}

            <Select value={chartView} onValueChange={onChartViewChange}>
              <SelectTrigger className="w-32 bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hourly">Per Jam</SelectItem>
                <SelectItem value="daily">Per Hari</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="h-[300px] sm:h-[400px] w-full">
          {isLoading ? (
            <LoadingSkeleton />
          ) : (filteredTimeData && filteredTimeData.length > 0) ||
            (chartView === "daily" && finalChartData.length > 0) ? (
            <ReactECharts
              option={chartOptions}
              style={{ height: "100%", width: "100%" }}
              opts={{ renderer: "svg" }}
            />
          ) : (
            <EmptyState />
          )}
        </div>

        {/* Summary stat singkat di atas (selalu tampil) */}
        <div className="flex flex-wrap gap-4 mb-2">
          <div className="flex items-center gap-1.5 text-sm">
            <span className="text-muted-foreground">Total Tonase:</span>
            <span className="font-semibold text-primary">
              {totalTonase.toLocaleString("id-ID", {
                maximumFractionDigits: 2,
              })}{" "}
              ton
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-sm">
            <span className="text-muted-foreground">Total Ritase:</span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
              {totalRitase.toLocaleString("id-ID")} ritase
            </span>
          </div>
        </div>

        {chartView === "daily" && (
          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Calculator className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-semibold text-foreground">
                  Analisis Prognosa
                  {startDate && endDate && (
                    <span className="text-sm font-normal text-muted-foreground ml-2">
                      ({prognosisResult.summary.periodStart} -{" "}
                      {prognosisResult.summary.periodEnd})
                    </span>
                  )}
                </h3>
              </div>
              <button
                onClick={() => setShowPrognosisTable(!showPrognosisTable)}
                className="text-sm text-primary hover:text-primary/80"
              >
                {showPrognosisTable ? "Sembunyikan Tabel" : "Tampilkan Tabel"}
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {/* Toggle Mode */}
              <div className="border border-border rounded-lg p-4 bg-muted/30">
                <label className="text-sm text-muted-foreground block mb-2">
                  Mode Perhitungan
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setTargetMode("period")}
                    className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm ${
                      targetMode === "period"
                        ? "bg-primary text-primary-foreground"
                        : "bg-background text-foreground border border-border"
                    }`}
                  >
                    Target Bulanan
                  </button>
                  <button
                    onClick={() => setTargetMode("daily")}
                    className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm ${
                      targetMode === "daily"
                        ? "bg-primary text-primary-foreground"
                        : "bg-background text-foreground border border-border"
                    }`}
                  >
                    Target Harian
                  </button>
                </div>
              </div>

              {/* Input berdasarkan mode */}
              {targetMode === "period" ? (
                <div className="border border-border rounded-lg p-4 bg-background">
                  <label className="text-sm text-muted-foreground block mb-1">
                    Target Periode (Ton)
                  </label>
                  <Input
                    type="number"
                    value={monthlyTarget}
                    onChange={(e) => setMonthlyTarget(e.target.value)}
                    className="w-full bg-background border-border text-foreground"
                    placeholder="Mis. 200000"
                  />
                  {prognosisResult.summary.totalDays > 0 &&
                    Number(monthlyTarget) > 0 && (
                      <p className="text-sm text-muted-foreground mt-2">
                        Prognosa Harian Otomatis:{" "}
                        <span className="font-semibold text-primary">
                          {prognosisResult.summary.dailyPrognosis.toLocaleString(
                            "id-ID",
                            {
                              maximumFractionDigits: 2,
                            },
                          )}{" "}
                          ton/hari
                        </span>
                        <span className="text-muted-foreground/80">
                          {" "}
                          ({prognosisResult.summary.totalDays} hari dalam
                          periode)
                        </span>
                      </p>
                    )}
                </div>
              ) : (
                <div className="border border-border rounded-lg p-4 bg-background">
                  <label className="text-sm text-muted-foreground block mb-1">
                    Target Harian (Ton/Hari)
                  </label>
                  <Input
                    type="number"
                    value={dailyTarget}
                    onChange={(e) => setDailyTarget(e.target.value)}
                    className="w-full bg-background border-border text-foreground"
                    placeholder="Mis. 10000"
                  />
                  {prognosisResult.summary.totalDays > 0 &&
                    Number(dailyTarget) > 0 && (
                      <p className="text-sm text-muted-foreground mt-2">
                        Total Target Periode:{" "}
                        <span className="font-semibold text-primary">
                          {prognosisResult.summary.monthlyTarget.toLocaleString(
                            "id-ID",
                            {
                              maximumFractionDigits: 2,
                            },
                          )}{" "}
                          ton
                        </span>
                        <span className="text-muted-foreground/80">
                          {" "}
                          ({prognosisResult.summary.totalDays} hari ×{" "}
                          {Number(dailyTarget).toLocaleString("id-ID")}{" "}
                          ton/hari)
                        </span>
                      </p>
                    )}
                </div>
              )}
            </div>

            <div className="border border-border rounded-lg p-4 space-y-3 bg-background">
              <h4 className="font-semibold text-foreground mb-3">
                Ringkasan Periode{" "}
                {startDate && endDate
                  ? `(${prognosisResult.summary.periodStart} - ${prognosisResult.summary.periodEnd})`
                  : "Bulan Ini"}
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-muted/30 p-3 rounded-lg border border-border">
                  <label className="text-sm text-muted-foreground">
                    Total Realisasi
                  </label>
                  <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                    {prognosisResult.summary.totalRealization.toLocaleString(
                      "id-ID",
                    )}{" "}
                    ton
                  </p>
                </div>
                <div className="bg-muted/30 p-3 rounded-lg border border-border">
                  <label className="text-sm text-muted-foreground">
                    Total Prognosa
                  </label>
                  <p className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                    {prognosisResult.summary.totalPrognosis.toLocaleString(
                      "id-ID",
                    )}{" "}
                    ton
                  </p>
                </div>
                <div className="bg-muted/30 p-3 rounded-lg border border-border">
                  <label className="text-sm font-medium text-muted-foreground">
                    Proyeksi Akhir Periode
                  </label>
                  <p className="text-lg font-semibold text-purple-600 dark:text-purple-400">
                    {prognosisResult.summary.projectedTotal.toLocaleString(
                      "id-ID",
                    )}{" "}
                    ton
                  </p>
                </div>
                <div className="bg-muted/30 p-3 rounded-lg border border-border">
                  <label className="text-sm text-muted-foreground">
                    Selisih dari Target
                  </label>
                  <p
                    className={`text-lg font-semibold ${
                      prognosisResult.summary.variance >= 0
                        ? "text-green-600 dark:text-green-400"
                        : "text-red-600 dark:text-red-400"
                    }`}
                  >
                    {Math.abs(prognosisResult.summary.variance).toLocaleString(
                      "id-ID",
                    )}{" "}
                    ton{" "}
                    {prognosisResult.summary.variance >= 0
                      ? "(Melebihi)"
                      : "(Kurang)"}
                  </p>
                </div>
              </div>

              {showPrognosisTable && (
                <div className="mt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      Detail per Hari
                    </span>
                  </div>
                  <div className="max-h-64 overflow-y-auto border border-border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50 border-border hover:bg-muted/50">
                          <TableHead className="sticky top-0 bg-muted/80 backdrop-blur text-foreground border-b border-border">
                            Tanggal
                          </TableHead>
                          <TableHead className="text-right sticky top-0 bg-muted/80 backdrop-blur text-foreground border-b border-border">
                            Realisasi
                          </TableHead>
                          <TableHead className="text-right sticky top-0 bg-muted/80 backdrop-blur text-foreground border-b border-border">
                            Prognosa
                          </TableHead>
                          <TableHead className="text-right sticky top-0 bg-muted/80 backdrop-blur text-foreground border-b border-border">
                            Kumulatif
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {prognosisResult.data.map((row) => {
                          const isToday = isEqual(
                            new Date(row.date),
                            startOfDay(new Date()),
                          );
                          const isPast = isBefore(
                            new Date(row.date),
                            startOfDay(new Date()),
                          );

                          return (
                            <TableRow
                              key={row.date}
                              className={`border-border ${
                                isToday
                                  ? "bg-primary/5 hover:bg-primary/10"
                                  : isPast
                                    ? "bg-muted/30 hover:bg-muted/50"
                                    : "bg-background hover:bg-muted/30"
                              }`}
                            >
                              <TableCell className="font-medium text-foreground">
                                {format(new Date(row.date), "dd/MM/yyyy")}
                                {isToday && (
                                  <span className="ml-2 text-[10px] uppercase font-bold tracking-wider bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                                    Hari ini
                                  </span>
                                )}
                              </TableCell>
                              <TableCell className="text-right text-muted-foreground">
                                {row.realization !== null ? (
                                  <span className="text-green-600 dark:text-green-400 font-medium">
                                    {row.realization.toLocaleString("id-ID")}
                                  </span>
                                ) : (
                                  "-"
                                )}
                              </TableCell>
                              <TableCell className="text-right text-muted-foreground">
                                {row.prognosis !== null ? (
                                  <span className="text-blue-600 dark:text-blue-400 font-medium">
                                    {row.prognosis.toLocaleString("id-ID", {
                                      maximumFractionDigits: 2,
                                    })}
                                  </span>
                                ) : (
                                  "-"
                                )}
                              </TableCell>
                              <TableCell className="text-right font-semibold text-foreground">
                                {row.cumulative.toLocaleString("id-ID", {
                                  maximumFractionDigits: 2,
                                })}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TonnageTimeChart;
