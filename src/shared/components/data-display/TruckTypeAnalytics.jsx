import React, { useMemo, useState } from "react";
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
import { Truck, Filter, Users, Calendar, TrendingUp } from "lucide-react";
import ReactECharts from "echarts-for-react";
import { EmptyState } from "@/shared/components/feedback/EmptyState";

const TruckTypeAnalytics = ({
  shipments = [],
  isLoading = false,
  selectedSource = "ALL",
  selectedDestination = "ALL",
  onSourceChange,
  onDestinationChange,
  showFilters = true,
  colors = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"],
  title = "Analitik Tronton & Trintin per Kontraktor",
  className = "",
  showTotal = true,
  stackBars = true,
  chartHeight = 400,
  customEmptyState,
}) => {
  const [analysisMode, setAnalysisMode] = useState("daily");
  const filterOptions = useMemo(() => {
    const sources = [
      ...new Set(shipments.map((s) => s.source).filter(Boolean)),
    ].sort();

    const destinations = [
      ...new Set(shipments.map((s) => s.destination).filter(Boolean)),
    ].sort();

    return { sources, destinations };
  }, [shipments]);

  const filteredShipments = useMemo(() => {
    const isAllSource = !selectedSource || selectedSource === "ALL";
    const isAllDestination =
      !selectedDestination || selectedDestination === "ALL";

    if (isAllSource && isAllDestination) {
      return shipments;
    }

    return shipments.filter((shipment) => {
      const source = shipment.source;
      const destination = shipment.destination;

      const matchesSource = isAllSource || source === selectedSource;
      const matchesDestination =
        isAllDestination || destination === selectedDestination;

      return matchesSource && matchesDestination;
    });
  }, [shipments, selectedSource, selectedDestination]);

  const chartData = useMemo(() => {
    const uniqueTrucks = new Map();

    filteredShipments.forEach((shipment) => {
      const attrs = shipment || {};

      let date = attrs.date_shift || attrs.shift_date || attrs.createdAt;
      if (date && typeof date === "string" && date.includes("T")) {
        date = date.split("T")[0];
      }

      const truckType = (attrs.type_truck || "").toLowerCase();
      const contractor = attrs.contractor || attrs.kontraktor || "Unknown";

      const hullNo =
        attrs.no_lambung || attrs.hull_no || attrs.hull_no_slr || "";

      if (truckType.includes("tronton") || truckType.includes("trintin")) {
        const uniqueKey = `${date}|${contractor}|${hullNo}|${truckType}`;

        if (!uniqueTrucks.has(uniqueKey)) {
          uniqueTrucks.set(uniqueKey, {
            date,
            contractor,
            truckType: truckType.includes("tronton") ? "Tronton" : "Trintin",
            hullNo,
          });
        }
      }
    });

    const dateContractorGroups = {};
    uniqueTrucks.forEach(({ date, contractor, truckType }) => {
      if (!date || !contractor) return;

      if (!dateContractorGroups[date]) {
        dateContractorGroups[date] = {};
      }

      if (!dateContractorGroups[date][contractor]) {
        dateContractorGroups[date][contractor] = { Tronton: 0, Trintin: 0 };
      }

      dateContractorGroups[date][contractor][truckType]++;
    });

    const allContractors = [
      ...new Set(Array.from(uniqueTrucks.values()).map((t) => t.contractor)),
    ].sort();

    const chartDates = Object.keys(dateContractorGroups).sort();

    return {
      dates: chartDates,
      contractors: allContractors,
      data: dateContractorGroups,
      uniqueTruckCount: uniqueTrucks.size,
    };
  }, [filteredShipments]);

  const processedChartData = useMemo(() => {
    if (!chartData.dates.length || !chartData.contractors.length) {
      return { dailyData: [], cumulativeData: [] };
    }

    const { dates, contractors, data } = chartData;

    const dailyData = dates.map((date) => {
      let totalTronton = 0;
      let totalTrintin = 0;

      contractors.forEach((contractor) => {
        const contractorData = data[date]?.[contractor] || {};
        totalTronton += contractorData.Tronton || 0;
        totalTrintin += contractorData.Trintin || 0;
      });

      return {
        date,
        Tronton: totalTronton,
        Trintin: totalTrintin,
        Total: totalTronton + totalTrintin,
      };
    });

    let cumulativeTronton = 0;
    let cumulativeTrintin = 0;

    const cumulativeData = dailyData.map((dayData) => {
      cumulativeTronton += dayData.Tronton;
      cumulativeTrintin += dayData.Trintin;

      return {
        date: dayData.date,
        Tronton: cumulativeTronton,
        Trintin: cumulativeTrintin,
        Total: cumulativeTronton + cumulativeTrintin,
      };
    });

    return { dailyData, cumulativeData };
  }, [chartData]);

  const formatDate = (dateStr) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "2-digit",
      });
    } catch (error) {
      return dateStr;
    }
  };

  const chartOptions = useMemo(() => {
    if (!chartData.dates.length || !chartData.contractors.length) {
      return {};
    }

    const { dates } = chartData;
    const currentData =
      analysisMode === "daily"
        ? processedChartData.dailyData
        : processedChartData.cumulativeData;

    // Detect dark mode
    const isDarkMode = document.documentElement.classList.contains("dark");
    const textColor = isDarkMode ? "#e5e7eb" : "#374151";
    const titleColor = isDarkMode ? "#f3f4f6" : "#374151";

    const series = [
      {
        name: "Tronton",
        type: analysisMode === "cumulative" ? "bar" : "bar",
        stack: stackBars && analysisMode === "daily" ? "total" : undefined,
        smooth: analysisMode === "cumulative",
        itemStyle: { color: isDarkMode ? "#60a5fa" : "#3b82f6" }, // Lighter blue for dark mode
        lineStyle: analysisMode === "cumulative" ? { width: 3 } : undefined,
        data: currentData.map((d) => d.Tronton),
        emphasis: {
          focus: "series",
        },
      },
      {
        name: "Trintin",
        type: analysisMode === "cumulative" ? "bar" : "bar",
        stack: stackBars && analysisMode === "daily" ? "total" : undefined,
        smooth: analysisMode === "cumulative",
        itemStyle: { color: isDarkMode ? "#34d399" : "#10b981" }, // Lighter green for dark mode
        lineStyle: analysisMode === "cumulative" ? { width: 3 } : undefined,
        data: currentData.map((d) => d.Trintin),
        emphasis: {
          focus: "series",
        },
      },
    ];

    if (showTotal && (!stackBars || analysisMode === "cumulative")) {
      series.push({
        name: "Total",
        type: "line",
        smooth: true,
        lineStyle: {
          width: 3,
          color: isDarkMode ? "#9ca3af" : "#6b7280",
          type: analysisMode === "cumulative" ? "solid" : "dashed",
        },
        itemStyle: { color: isDarkMode ? "#9ca3af" : "#6b7280" },
        data: currentData.map((d) => d.Total),
        emphasis: {
          focus: "series",
        },
      });
    }

    return {
      title: {
        text: `Jumlah Kendaraan Unik ${analysisMode === "daily" ? "per Hari" : "Kumulatif"} (Semua Kontraktor)`,
        left: "center",
        top: 10,
        textStyle: {
          fontSize: 16,
          fontWeight: "normal",
          color: titleColor,
        },
      },
      tooltip: {
        trigger: "axis",
        axisPointer: {
          type: analysisMode === "cumulative" ? "line" : "shadow",
        },
        backgroundColor: isDarkMode
          ? "rgba(31, 41, 55, 0.95)"
          : "rgba(255, 255, 255, 0.95)",
        borderColor: isDarkMode ? "#374151" : "#e5e7eb",
        textStyle: {
          color: isDarkMode ? "#f3f4f6" : "#1f2937",
        },
        formatter: (params) => {
          const date = params[0].axisValue;
          const formattedDate = formatDate(date);
          let tooltip = `<strong>Tanggal:</strong> ${formattedDate}<br/>`;

          tooltip += `<strong>Mode:</strong> ${analysisMode === "daily" ? "Harian" : "Kumulatif"}<br/>`;

          if (selectedSource !== "ALL" || selectedDestination !== "ALL") {
            const bgColor = isDarkMode ? "#1f2937" : "#f3f4f6";
            tooltip += `<div style="margin: 5px 0; padding: 5px; background: ${bgColor}; border-radius: 4px; font-size: 12px;">`;
            if (selectedSource !== "ALL")
              tooltip += `<strong>Source:</strong> ${selectedSource}<br/>`;
            if (selectedDestination !== "ALL")
              tooltip += `<strong>Destination:</strong> ${selectedDestination}<br/>`;
            tooltip += "</div>";
          }

          let totalVehicles = 0;
          params.forEach((param) => {
            if (param.seriesName !== "Total") {
              const label =
                analysisMode === "daily"
                  ? "kendaraan hari ini"
                  : "kendaraan total";
              tooltip += `<span style="color: ${param.color};">●</span> ${param.seriesName}: <strong>${param.value}</strong> ${label}<br/>`;
              totalVehicles += param.value;
            }
          });

          if (totalVehicles > 0) {
            const totalLabel =
              analysisMode === "daily" ? "Total Hari Ini" : "Total Kumulatif";
            tooltip += `<br/><strong>${totalLabel}:</strong> ${totalVehicles} kendaraan unik`;

            if (analysisMode === "daily") {
              const contractorsOnDate = chartData.contractors.filter(
                (contractor) => {
                  const contractorData =
                    chartData.data[date]?.[contractor] || {};
                  return (
                    (contractorData.Tronton || 0) > 0 ||
                    (contractorData.Trintin || 0) > 0
                  );
                },
              );

              if (contractorsOnDate.length > 0) {
                const contractorColor = isDarkMode ? "#9ca3af" : "#6b7280";
                tooltip += `<br/><small style="color: ${contractorColor};">Dari ${contractorsOnDate.length} kontraktor: ${contractorsOnDate.join(", ")}</small>`;
              }
            }
          }

          return tooltip;
        },
      },
      legend: {
        data:
          showTotal && (!stackBars || analysisMode === "cumulative")
            ? ["Tronton", "Trintin", "Total"]
            : ["Tronton", "Trintin"],
        bottom: 10,
        itemGap: 20,
        textStyle: {
          color: textColor,
        },
      },
      grid: {
        left: "3%",
        right: "4%",
        bottom: "15%",
        top: "20%",
        containLabel: true,
      },
      xAxis: {
        type: "category",
        data: dates,
        axisLabel: {
          formatter: formatDate,
          rotate: dates.length > 10 ? 45 : 0,
          fontSize: 12,
          color: textColor,
        },
        axisTick: {
          alignWithLabel: true,
        },
        axisLine: {
          lineStyle: {
            color: isDarkMode ? "#4b5563" : "#e5e7eb",
          },
        },
      },
      yAxis: {
        type: "value",
        name: `Jumlah Kendaraan ${analysisMode === "daily" ? "(Harian)" : "(Kumulatif)"}`,
        nameLocation: "middle",
        nameGap: 50,
        nameTextStyle: {
          color: textColor,
        },
        axisLabel: {
          formatter: (value) => Math.floor(value).toString(),
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
        minInterval: 1,
      },
      series,

      media: [
        {
          query: { maxWidth: 640 },
          option: {
            grid: {
              left: "10%",
              right: "5%",
              bottom: "20%",
            },
            xAxis: {
              axisLabel: {
                rotate: 45,
                fontSize: 10,
              },
            },
          },
        },
      ],
    };
  }, [
    chartData,
    processedChartData,
    analysisMode,
    colors,
    showTotal,
    stackBars,
    selectedSource,
    selectedDestination,
  ]);

  const LoadingSkeleton = () => (
    <div className="animate-pulse space-y-4">
      <div className="flex justify-between items-center">
        <div className="h-6 bg-muted rounded w-1/3"></div>
        <div className="flex space-x-2">
          <div className="h-8 bg-muted rounded w-24"></div>
          <div className="h-8 bg-muted rounded w-24"></div>
        </div>
      </div>
      <div className="h-4 bg-muted/50 rounded w-full"></div>
      <div className="h-[400px] bg-muted rounded"></div>
    </div>
  );

  const getStatsSummary = () => {
    if (!chartData.dates.length) return null;

    const { dates, contractors, uniqueTruckCount } = chartData;
    const { dailyData, cumulativeData } = processedChartData;

    const totalDays = dates.length;
    const totalContractors = contractors.length;

    const dailyTotalTronton = dailyData.reduce(
      (sum, day) => sum + day.Tronton,
      0,
    );
    const dailyTotalTrintin = dailyData.reduce(
      (sum, day) => sum + day.Trintin,
      0,
    );

    const cumulativeTotal =
      cumulativeData.length > 0
        ? cumulativeData[cumulativeData.length - 1]
        : { Tronton: 0, Trintin: 0, Total: 0 };

    return {
      totalDays,
      totalContractors,
      uniqueTruckCount,
      daily: {
        totalTronton: dailyTotalTronton,
        totalTrintin: dailyTotalTrintin,
        totalVehicles: dailyTotalTronton + dailyTotalTrintin,
      },
      cumulative: {
        totalTronton: cumulativeTotal.Tronton,
        totalTrintin: cumulativeTotal.Trintin,
        totalVehicles: cumulativeTotal.Total,
      },
    };
  };

  const stats = getStatsSummary();

  return (
    <Card className={`overflow-hidden ${className}`}>
      <CardHeader className="space-y-0 pb-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          {/* Title with filter indicator */}
          <CardTitle className="flex items-center space-x-2 text-foreground">
            <Truck className="w-5 h-5 text-primary" />
            <span>{title}</span>
            {(selectedSource !== "ALL" || selectedDestination !== "ALL") && (
              <span className="flex items-center space-x-1 text-sm text-primary px-2 py-1 rounded-full bg-primary/10">
                <Filter className="w-3 h-3" />
                <span>Filtered</span>
              </span>
            )}
          </CardTitle>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
            <div className="flex items-center space-x-2 rounded-lg p-1 bg-muted/30">
              <button
                onClick={() => setAnalysisMode("daily")}
                className={`flex items-center space-x-1 px-3 py-1 rounded-md text-sm transition-all shadow-sm ${
                  analysisMode === "daily"
                    ? "bg-background text-foreground ring-1 ring-border"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
                }`}
              >
                <Calendar className="w-3 h-3" />
                <span>Harian</span>
              </button>
              <button
                onClick={() => setAnalysisMode("cumulative")}
                className={`flex items-center space-x-1 px-3 py-1 rounded-md text-sm transition-all shadow-sm ${
                  analysisMode === "cumulative"
                    ? "bg-background text-foreground ring-1 ring-border"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
                }`}
              >
                <TrendingUp className="w-3 h-3" />
                <span>Kumulatif</span>
              </button>
            </div>

            {/* Filter controls */}
            {showFilters && onSourceChange && onDestinationChange && (
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
                <Select
                  value={selectedSource || "ALL"}
                  onValueChange={onSourceChange}
                >
                  <SelectTrigger className="w-full sm:w-36 bg-background">
                    <SelectValue placeholder="Pilih Source" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Semua Source</SelectItem>
                    {filterOptions.sources.map((source) => (
                      <SelectItem key={source} value={source}>
                        {source}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={selectedDestination || "ALL"}
                  onValueChange={onDestinationChange}
                >
                  <SelectTrigger className="w-full sm:w-36 bg-background">
                    <SelectValue placeholder="Pilih Destination" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Semua Destination</SelectItem>
                    {filterOptions.destinations.map((destination) => (
                      <SelectItem key={destination} value={destination}>
                        {destination}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </div>

        {/* Enhanced Statistics summary */}
        {isLoading ? (
          <LoadingSkeleton />
        ) : (
          stats && (
            <div className="mt-4 p-4 bg-muted/30 rounded-lg border border-border">
              {/* Basic stats */}
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-3">
                <div className="flex items-center space-x-1">
                  <Users className="w-4 h-4" />
                  <span>
                    <strong className="text-foreground">
                      {stats.totalContractors}
                    </strong>{" "}
                    Kontraktor
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  <Calendar className="w-4 h-4" />
                  <span>
                    <strong className="text-foreground">
                      {stats.totalDays}
                    </strong>{" "}
                    Hari
                  </span>
                </div>
                <span className="text-primary">
                  <strong>{stats.uniqueTruckCount}</strong> Trucks Total
                </span>
              </div>

              {/* Mode-specific stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-border">
                {/* Daily Stats */}
                <div className="bg-background p-3 rounded-md border border-border shadow-sm">
                  <h4 className="text-sm font-semibold text-primary mb-2 flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    Statistik Harian
                  </h4>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <div>
                      Tronton:{" "}
                      <span className="font-semibold text-blue-600 dark:text-blue-400">
                        {stats.daily.totalTronton}
                      </span>{" "}
                      total harian
                    </div>
                    <div>
                      Trintin:{" "}
                      <span className="font-semibold text-green-600 dark:text-green-400">
                        {stats.daily.totalTrintin}
                      </span>{" "}
                      total harian
                    </div>
                    <div className="pt-1 border-t border-border mt-1">
                      Total:{" "}
                      <span className="font-bold text-foreground">
                        {stats.daily.totalVehicles}
                      </span>{" "}
                      kendaraan-hari
                    </div>
                  </div>
                </div>

                {/* Cumulative Stats */}
                <div className="bg-background p-3 rounded-md border border-border shadow-sm">
                  <h4 className="text-sm font-semibold text-primary mb-2 flex items-center">
                    <TrendingUp className="w-4 h-4 mr-1" />
                    Statistik Kumulatif
                  </h4>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <div>
                      Tronton:{" "}
                      <span className="font-semibold text-blue-600 dark:text-blue-400">
                        {stats.cumulative.totalTronton}
                      </span>{" "}
                      unik
                    </div>
                    <div>
                      Trintin:{" "}
                      <span className="font-semibold text-green-600 dark:text-green-400">
                        {stats.cumulative.totalTrintin}
                      </span>{" "}
                      unik
                    </div>
                    <div className="pt-1 border-t border-border mt-1">
                      Total:{" "}
                      <span className="font-bold text-foreground">
                        {stats.cumulative.totalVehicles}
                      </span>{" "}
                      kendaraan unik
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        )}
      </CardHeader>

      <CardContent>
        <div className={`w-full`} style={{ height: `${chartHeight}px` }}>
          {isLoading ? (
            <LoadingSkeleton />
          ) : chartData.dates && chartData.dates.length > 0 ? (
            <ReactECharts
              option={chartOptions}
              style={{ height: "100%", width: "100%" }}
              opts={{ renderer: "canvas" }}
              notMerge={true}
              lazyUpdate={true}
            />
          ) : (
            <EmptyState
              icon={Truck}
              title="Tidak Ada Data Kendaraan"
              description={
                selectedSource !== "ALL" || selectedDestination !== "ALL"
                  ? "Tidak ada data kendaraan Tronton/Trintin untuk filter yang dipilih. Coba ubah pengaturan filter."
                  : "Belum ada data kendaraan Tronton atau Trintin yang tersedia."
              }
              actionLabel={
                selectedSource !== "ALL" || selectedDestination !== "ALL"
                  ? "Reset Filter"
                  : undefined
              }
              onAction={
                selectedSource !== "ALL" || selectedDestination !== "ALL"
                  ? () => {
                      onSourceChange?.("ALL");
                      onDestinationChange?.("ALL");
                    }
                  : undefined
              }
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TruckTypeAnalytics;
