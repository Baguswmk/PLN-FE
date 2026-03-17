/**
 * Overview Service
 * Mengambil data aggregated dari tabel Summary Strapi untuk ditampilkan di dashboard.
 */
import httpClient from "@/core/api/httpClient";

export const overviewService = {
  /**
   * Ambil data ringkasan per hari dalam range tanggal tertentu.
   * @param {string} startDate - format YYYY-MM-DD
   * @param {string} endDate - format YYYY-MM-DD
   * @param {string} shift - "all" | "1" | "2"
   */
  async getSummaryData(startDate, endDate, shift = "all") {
    const params = {
      "pagination[pageSize]": 100, // Max range hari
      "sort": "date:asc",
    };
    if (startDate) params["filters[date][$gte]"] = startDate;
    if (endDate) params["filters[date][$lte]"] = endDate;
    if (shift && shift !== "all" && shift !== "semua") {
      params["filters[shift][$eq]"] = parseInt(shift, 10);
    }

    const response = await httpClient.get("/summaries", { params });
    const summaries = response.data?.data || [];

    // Aggregate totals
    const total = summaries.reduce(
      (acc, s) => ({
        totalTonnage: acc.totalTonnage + (parseFloat(s.total_net_weight) || 0),
        totalRitase: acc.totalRitase + (parseInt(s.total_shipment) || 0),
        totalFinish: acc.totalFinish + (parseInt(s.total_finish) || 0),
        totalInTransit: acc.totalInTransit + (parseInt(s.total_intransit) || 0),
        avgDuration: acc.avgDuration + (parseFloat(s.avg_duration) || 0),
      }),
      { totalTonnage: 0, totalRitase: 0, totalFinish: 0, totalInTransit: 0, avgDuration: 0 }
    );

    if (summaries.length > 0) {
      total.avgDuration = Math.round(total.avgDuration / summaries.length);
    }

    // Build chart data grouped by date, adding a date label
    const chartMap = {};
    summaries.forEach((s) => {
      const key = s.date;
      if (!key) return;
      if (!chartMap[key]) {
        const parts = key.split("-");
        const nameStr = `${parts[2]}/${parts[1]}`;
        chartMap[key] = { name: nameStr, date: key, sdjTonase: 0, romTonase: 0, sdjRitase: 0, romRitase: 0 };
      }
      // Summary currently is shared for all. Use total_net_weight for both SDJ and ROM for now.
      chartMap[key].sdjTonase += parseFloat(s.total_net_weight) || 0;
      chartMap[key].romTonase += parseFloat(s.total_net_weight) || 0;
      chartMap[key].sdjRitase += parseInt(s.total_shipment) || 0;
      chartMap[key].romRitase += parseInt(s.total_shipment) || 0;
    });

    const chartData = Object.values(chartMap);

    return {
      success: true,
      data: summaries,
      analytics: {
        ...total,
        totalTonnage: total.totalTonnage.toFixed(2),
        chartData,
      },
    };
  },
};
