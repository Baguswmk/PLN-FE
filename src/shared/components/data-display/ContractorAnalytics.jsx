import React from "react";
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
import { BarChart, Truck } from "lucide-react";
import ReactECharts from "echarts-for-react";

const DEFAULT_CONTRACTOR_COLORS = [
  "#8884d8",
  "#82ca9d",
  "#ffc658",
  "#ff7300",
  "#00ff00",
  "#0088fe",
  "#00c49f",
  "#ffbb28",
  "#ff8042",
  "#8dd1e1",
];

import { EmptyState } from "@/shared/components/feedback/EmptyState";

// Defined at module scope so it's not recreated on every ContractorAnalytics render
const LoadingSkeleton = () => (
  <div className="animate-pulse space-y-4">
    <div className="h-6 bg-muted rounded w-1/3 mx-auto"></div>
    <div className="h-[400px] bg-muted rounded"></div>
  </div>
);

const ContractorAnalytics = ({
  // Data props
  contractorData = [],

  // Loading state
  isLoading = false,
  dashboardLoading = false,

  // Chart view controls
  chartView = "daily",
  onChartViewChange,
  chartViewOptions = [
    { value: "hourly", label: "Jam" },
    { value: "daily", label: "Hari" },
  ],

  // Customization props
  colors = DEFAULT_CONTRACTOR_COLORS,
  title = "Kontraktor",
  chartTitle = "Distribusi Ritase Kontraktor",

  // Chart configuration
  showChartControls = true,

  // Additional props
  className = "",
}) => {
  const sortedContractorData = [...contractorData].sort(
    (a, b) => (b.ritase || b.count || 0) - (a.ritase || a.count || 0),
  );
  const defaultChartConfig = {
    title: {
      text: chartTitle,
      left: "center",
      textStyle: { fontSize: 16 },
    },
    tooltip: {
      trigger: "axis",
      axisPointer: {
        type: "shadow",
      },
      formatter: "{b}: {c} ritase",
    },
    grid: {
      left: "3%",
      right: "4%",
      bottom: "10%",
      top: "15%",
      containLabel: true,
    },
    xAxis: {
      type: "category",
      data: sortedContractorData.map((c) => c.name),
      axisLabel: {
        interval: 0,
        rotate: 30,
        overflow: "truncate",
      },
    },
    yAxis: {
      type: "value",
      name: "Ritase",
      nameLocation: "middle",
      nameGap: 40,
      axisLabel: {
        formatter: "{value}",
      },
    },
    series: [
      {
        name: "Ritase",
        type: "bar",
        barWidth: "60%",
        data: sortedContractorData.map((entry, index) => ({
          value: entry.count || entry.ritase || 0,
          itemStyle: {
            color: colors[index % colors.length],
          },
        })),
        label: {
          show: true,
          position: "top",
        },
      },
    ],
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Chart Controls */}
      {showChartControls && (
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {(isLoading || dashboardLoading) && (
              <div className="flex items-center space-x-2 text-sm text-primary">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent"></div>
                <span>Loading chart data...</span>
              </div>
            )}
          </div>

          {onChartViewChange && (
            <div className="flex items-center space-x-2">
              <Select value={chartView} onValueChange={onChartViewChange}>
                <SelectTrigger className="w-32 bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {chartViewOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      )}

      {/* Pie Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-foreground">
            <BarChart className="w-5 h-5 text-muted-foreground text-primary" />
            <span>{title}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px]">
            {isLoading ? (
              <LoadingSkeleton />
            ) : contractorData && contractorData.length > 0 ? (
              <ReactECharts
                option={defaultChartConfig}
                style={{ height: "100%", width: "100%" }}
              />
            ) : (
              <EmptyState
                icon={Truck}
                title="Tidak Ada Data Kendaraan"
                description={
                  "Belum ada data kendaraan Tronton atau Trintin yang tersedia."
                }
              />
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ContractorAnalytics;
