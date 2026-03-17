import React, { useState } from "react";
import ContractorAnalytics from "./ContractorAnalytics";
import TonnageTimeChart from "./TonnageTimeChart";
import TruckTypeAnalytics from "./TruckTypeAnalytics";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";

const AnalyticsDashboard = ({
  // Data props
  contractorData = [],
  hourlyData = [],
  dailyData = [],
  shipments = [],

  // Loading state
  isLoading = false,
  dateRange,
  // Chart view controls
  chartView = "daily",
  onChartViewChange,
  chartViewOptions = [
    { value: "hourly", label: "Per Jam" },
    { value: "daily", label: "Per Hari" },
  ],

  // Layout configuration
  layout = "vertical",
  showContractorAnalytics = false,
  showTonnageChart = true,
  showTruckTypeAnalytics = false,

  // Contractor analytics props
  contractorProps = {},

  // Tonnage chart props
  tonnageProps = {},

  // Additional props
  className = "",
}) => {
  // ✅ Filter states
  const [selectedSource, setSelectedSource] = useState("ALL");
  const [selectedDestination, setSelectedDestination] = useState("ALL");
  const startDate = dateRange.startDate;
  const endDate = dateRange.endDate;
  const renderLayout = () => {
    const contractorComponent = showContractorAnalytics && (
      <div className="w-full">
        <ContractorAnalytics
          contractorData={contractorData}
          isLoading={isLoading}
          chartView={chartView}
          onChartViewChange={onChartViewChange}
          chartViewOptions={chartViewOptions}
          showChartControls={false}
          className="h-full"
          {...contractorProps}
        />
      </div>
    );

    const truckTypeComponent = showTruckTypeAnalytics && (
      <div className="w-full">
        <TruckTypeAnalytics
          shipments={shipments || []}
          isLoading={isLoading}
          selectedSource={selectedSource}
          selectedDestination={selectedDestination}
          onSourceChange={setSelectedSource}
          onDestinationChange={setSelectedDestination}
          showFilters={true}
        />
      </div>
    );

    const tonnageComponent = showTonnageChart && (
      <div className="w-full">
        <TonnageTimeChart
          timeData={chartView === "hourly" ? hourlyData : dailyData}
          shipments={shipments || []}
          isLoading={isLoading}
          chartView={chartView}
          onChartViewChange={onChartViewChange}
          chartViewOptions={chartViewOptions}
          showChartControls={false}
          showFilters={true}
          selectedSource={selectedSource}
          selectedDestination={selectedDestination}
          onSourceChange={setSelectedSource}
          onDestinationChange={setSelectedDestination}
          className="h-full"
          startDate={startDate}
          endDate={endDate}
          {...tonnageProps}
        />
      </div>
    );

    switch (layout) {
      case "horizontal":
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            {tonnageComponent}
            {contractorComponent}
          </div>
        );

      case "grid":
        return (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-6">
            {tonnageComponent}
            {contractorComponent}
          </div>
        );

      default: // vertical
        return (
          <div className="flex flex-col gap-4 md:gap-6">
            {tonnageComponent}
            {contractorComponent}
            {truckTypeComponent}
          </div>
        );
    }
  };

  return (
    <div className={`space-y-4 md:space-y-2 grid grid-cols-1 ${className}`}>
      {/* Global Chart Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-4 w-full sm:w-auto">
          {isLoading && (
            <div className="flex items-center space-x-2 text-sm text-primary">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent"></div>
              <span>Loading analytics data...</span>
            </div>
          )}
        </div>

      </div>

      {/* Charts Layout */}
      {renderLayout()}
    </div>
  );
};

export default AnalyticsDashboard;
