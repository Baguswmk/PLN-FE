import React, { useEffect, useState, useMemo } from "react";
import { startOfMonth, endOfMonth } from "date-fns";
import { saveAs } from "file-saver";
import ExcelJS from "exceljs";
import jsPDF from "jspdf";
import "jspdf-autotable";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/shared/components/ui/tabs";
import {
  Truck,
  BarChart3,
  List,
  QrCode,
  Eye,
  Edit,
  Trash2,
  RefreshCw,
  Search,
  Filter,
  FileSpreadsheet,
  FileText,
  Link as LinkIcon,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Input } from "@/shared/components/ui/input";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/shared/components/ui/dialog";
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
import AnalyticsDashboard from "@/shared/components/data-display/AnalyticsDashboard";
import { DateRangePicker } from "@/shared/components/form/DateRangePicker";
import EmptyState from "@/shared/components/data-display/EmptyState";
import QrScannerModal from "@/shared/components/dialogs/QrScannerModal";
import ManualInputDialog from "@/shared/components/dialogs/ManualInputDialog";
import RegisterShipmentDialog from "../components/RegisterShipmentDialog";
import MatchSjbDialog from "../components/MatchSjbDialog";
import ShipmentDetailDialog from "@/shared/components/dialogs/ShipmentDetailDialog";
import { useRomStore } from "../store/useRomStore";
import PermissionGuard from "@/shared/components/guard/PermissionGuard";
import { PERMISSIONS } from "@/config/permissions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import Pagination from "@/shared/components/navigation/Pagination";
import AdvancedFilterPopover from "@/shared/components/filters/AdvancedFilterPopover";
import { TableSkeleton } from "@/shared/components/ui/table-skeleton";
import { romService } from "../services/romService";

export default function PengeluaranRomPage() {
  const {
    data: paginatedData,
    recentData,
    totalItems,
    isLoading,
    currentPage,
    itemsPerPage,
    searchQuery,
    dateRange,
    shift,
    analytics,
    analyticsView,
    activeTab,
    setActiveTab,
    setDateRange,
    setShift,
    setAnalyticsView,
    setCurrentPage,
    setItemsPerPage,
    setSearchQuery,
    fetchAnalytics,
    applyFilters,
    deleteItem,
  } = useRomStore();

  // Mount: fetch overview (tab default)
  useEffect(() => {
    useRomStore.getState().fetchOverview();
  }, []);

  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [matchSjbModalOpen, setMatchSjbModalOpen] = useState(false);
  const [isMatchingSjb, setIsMatchingSjb] = useState(false);
  const chartView = analyticsView || "daily";

  // Modal states
  const [selectedItem, setSelectedItem] = useState(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  // Edit form state
  const [editFields, setEditFields] = useState({});
  const [editReason, setEditReason] = useState("");
  const [deleteReason, setDeleteReason] = useState("");
  const [advancedFilters, setAdvancedFilters] = useState({
    loading: "all",
    dumping: "all",
    lot: "all",
    status: "all",
  });

  const dashboardDateRange = useMemo(() => {
    if (!dateRange)
      return { from: startOfMonth(new Date()), to: endOfMonth(new Date()) };
    return dateRange;
  }, [dateRange]);

  useEffect(() => {
    if (activeTab === "analytics") {
      fetchAnalytics({ view: chartView });
    }
  }, [activeTab, chartView, fetchAnalytics]);

  const dashboardTimeData = useMemo(() => {
    const chartData = analytics?.chartData || [];
    if (!Array.isArray(chartData)) return [];

    const baseDate = dashboardDateRange?.from
      ? new Date(dashboardDateRange.from)
      : new Date();
    const y = baseDate.getFullYear();
    const m = String(baseDate.getMonth() + 1).padStart(2, "0");
    const d = String(baseDate.getDate()).padStart(2, "0");
    const baseYmd = `${y}-${m}-${d}`;

    return chartData.map((row) => {
      const label = String(row?.label || "");
      const isHourlyLabel = /^\d{2}:\d{2}$/.test(label);
      let hourlyTimestamp = `${baseYmd}T${label.slice(0, 2)}:00:00`;
      if (isHourlyLabel) {
        const hour = Number(label.slice(0, 2));
        const pointDate = new Date(baseDate);
        if (!Number.isNaN(hour) && hour < 6) {
          pointDate.setDate(pointDate.getDate() + 1);
        }
        const py = pointDate.getFullYear();
        const pm = String(pointDate.getMonth() + 1).padStart(2, "0");
        const pd = String(pointDate.getDate()).padStart(2, "0");
        hourlyTimestamp = `${py}-${pm}-${pd}T${label.slice(0, 2)}:00:00`;
      }

      return {
        time: isHourlyLabel ? hourlyTimestamp : label,
        date: label,
        tonnage: Number(row?.Tonase || 0),
        count: Number(row?.Ritase || 0),
        crushed: Number(row?.Crushed || 0),
        uncrushed: Number(row?.Uncrushed || 0),
      };
    });
  }, [analytics?.chartData, dashboardDateRange]);

  const handleScan = async (result) => {
    toast.loading("Memproses Data QR...", { id: "scan-toast" });
    const res = await useRomStore.getState().createItem({ no_do: result });
    if (res?.success) {
      toast.success("Berhasil mencatat Pengeluaran ROM!", { id: "scan-toast" });
    } else {
      toast.error(`Gagal mencatat data: ${res?.error || ""}`, {
        id: "scan-toast",
      });
    }
  };

  const numericItemsPerPage =
    itemsPerPage === "All" || itemsPerPage === totalItems
      ? totalItems
      : itemsPerPage;
  const totalPages = Math.max(1, Math.ceil(totalItems / numericItemsPerPage));

  // Client-side filter by advanced filters only (instan, offline-friendly)
  const filteredData = useMemo(() => {
    let result = paginatedData;
    if (advancedFilters.status && advancedFilters.status !== "all") {
      result = result.filter((item) => item.finish?.status === advancedFilters.status);
    }
    if (advancedFilters.loading && advancedFilters.loading !== "all") {
      result = result.filter((item) => item.loading === advancedFilters.loading);
    }
    if (advancedFilters.dumping && advancedFilters.dumping !== "all") {
      result = result.filter((item) => item.dumping === advancedFilters.dumping);
    }
    if (advancedFilters.lot && advancedFilters.lot !== "all") {
      result = result.filter((item) => item.lot === advancedFilters.lot);
    }
    return result;
  }, [paginatedData, advancedFilters]);

  const handleDetail = (item) => {
    setSelectedItem(item);
    setViewModalOpen(true);
  };

  // const formCreate = useForm({
  //   resolver: zodResolver(createRomSchema),
  //   mode: "onBlur",
  //   defaultValues: {
  //     no_do: "",
  //     coal_type: "CRUSHED",
  //     hull_no: "",
  //     lot: "",
  //     loading: "MTB - STOCK TS WESTHAM",
  //     dumping: "SP PORT SDJ",
  //     net_weight: "",
  //   },
  // });

  const handleEdit = (item) => {
    setSelectedItem(item);
    setEditFields({
      no_do: item.no_do || "",
      hull_no: item.hull_no || "",
      lot: item.lot || "",
      loading: item.loading || "",
      dumping: item.dumping || "",
      net_weight: item.net_weight || "",
      coal_type: item.coal_type || "",
    });
    setEditReason("");
    setEditModalOpen(true);
  };

  const handleDelete = (item) => {
    setSelectedItem(item);
    setDeleteModalOpen(true);
  };

  const { updateItem } = useRomStore();

  const confirmEdit = async () => {
    if (!selectedItem) return;
    if (!editReason.trim()) {
      toast.error("Alasan perubahan wajib diisi!");
      return;
    }
    const result = await updateItem(selectedItem.id, {
      ...editFields,
      edit_reason: editReason,
    });
    if (result?.success) {
      toast.success("Data berhasil diperbarui!");
      setEditModalOpen(false);
    } else {
      toast.error(result?.error || "Gagal memperbarui data");
    }
  };

  const confirmDelete = async () => {
    if (selectedItem) {
      if (!deleteReason.trim()) {
        toast.error("Alasan penghapusan wajib diisi!");
        return;
      }
      const result = await deleteItem(selectedItem.id, deleteReason);
      if (result?.success) {
        toast.success(
          `Berhasil menghapus ${selectedItem?.no_do || selectedItem?.id}`,
        );
        setDeleteModalOpen(false);
        setDeleteReason("");
      } else {
        toast.error(result?.error || "Gagal menghapus data");
      }
    }
  };

  const handleRefresh = () => {
    applyFilters();
    toast.success("Data berhasil diperbarui!");
  };

  const handleExportExcel = async () => {
    toast.loading("Menyiapkan file Excel...", { id: "export-excel" });
    try {
      const state = useRomStore.getState();
      const params = {
        startDate: state.dateRange?.from,
        endDate: state.dateRange?.to,
        shift: state.shift,
        search: state.searchQuery,
        limit: "All"
      };
      
      const response = await romService.getAllData(params);
      const dataToExport = response.data || [];

      if (dataToExport.length === 0) {
        toast.error("Tidak ada data untuk diekspor", { id: "export-excel" });
        return;
      }

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Pengeluaran ROM");

      worksheet.columns = [
        { header: "No.", key: "no", width: 5 },
        { header: "No. DO", key: "no_do", width: 20 },
        { header: "Tanggal", key: "date", width: 15 },
        { header: "Waktu", key: "time", width: 15 },
        { header: "Truk (Hull No)", key: "hull_no", width: 15 },
        { header: "Lot", key: "lot", width: 15 },
        { header: "Tipe", key: "coal_type", width: 15 },
        { header: "Asal (Loading)", key: "loading", width: 25 },
        { header: "Tujuan (Dumping)", key: "dumping", width: 25 },
        { header: "Net Weight (Ton)", key: "net_weight", width: 15 },
        { header: "Status", key: "status", width: 15 },
      ];

      worksheet.getRow(1).font = { bold: true };

      dataToExport.forEach((item, index) => {
        worksheet.addRow({
          no: index + 1,
          no_do: item.no_do || "-",
          date: item.date_shift || item.date || "-",
          time: item.time ? item.time.substring(0, 5) : "-",
          hull_no: item.hull_no || "-",
          lot: item.lot || "-",
          coal_type: item.coal_type || "-",
          loading: item.loading || "-",
          dumping: item.dumping || "-",
          net_weight: item.net_weight || 0,
          status: item.finish?.status || "IN_TRANSIT",
        });
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      saveAs(blob, `Pengeluaran_ROM_${new Date().getTime()}.xlsx`);
      toast.success("Berhasil ekspor ke Excel", { id: "export-excel" });
    } catch (error) {
      console.error(error);
      toast.error("Gagal mengekspor data", { id: "export-excel" });
    }
  };

  const handleExportPdf = async () => {
    toast.loading("Menyiapkan file PDF...", { id: "export-pdf" });
    try {
      const state = useRomStore.getState();
      const params = {
        startDate: state.dateRange?.from,
        endDate: state.dateRange?.to,
        shift: state.shift,
        search: state.searchQuery,
        limit: "All"
      };
      
      const response = await romService.getAllData(params);
      const dataToExport = response.data || [];

      if (dataToExport.length === 0) {
        toast.error("Tidak ada data untuk diekspor", { id: "export-pdf" });
        return;
      }

      const doc = new jsPDF("landscape");
      doc.text("Data Pengeluaran ROM", 14, 15);
      
      const head = [["No.", "No. DO", "Tanggal", "Waktu", "Truk", "Lot", "Loading", "Dumping", "Tonase", "Status"]];
      const body = dataToExport.map((item, index) => [
        index + 1,
        item.no_do || "-",
        item.date_shift || item.date || "-",
        item.time ? item.time.substring(0, 5) : "-",
        item.hull_no || "-",
        item.lot || "-",
        item.loading || "-",
        item.dumping || "-",
        item.net_weight || 0,
        item.finish?.status || "IN_TRANSIT"
      ]);

      doc.autoTable({
        head: head,
        body: body,
        startY: 20,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [41, 128, 185] }
      });

      doc.save(`Pengeluaran_ROM_${new Date().getTime()}.pdf`);
      toast.success("Berhasil ekspor ke PDF", { id: "export-pdf" });
    } catch (error) {
      console.error(error);
      toast.error("Gagal mengekspor data", { id: "export-pdf" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Pengeluaran ROM</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Pantau dan kelola pengiriman batubara.
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <PermissionGuard permission={PERMISSIONS.CREATE_ROM}>
            <Button
              className="shrink-0 gap-2"
              onClick={() => setRegisterModalOpen(true)}
            >
              <Truck className="w-4 h-4" />
              <span>Register DT</span>
            </Button>
          </PermissionGuard>
          <PermissionGuard permission={PERMISSIONS.CREATE_ROM}>
            <Button
              variant="outline"
              className="shrink-0 gap-2"
              onClick={() => setMatchSjbModalOpen(true)}
            >
              <QrCode className="w-4 h-4" />
              <span>Match SJB</span>
            </Button>
          </PermissionGuard>
          <Button
            variant="outline"
            className="shrink-0 gap-2"
            onClick={() => setIsScannerOpen(true)}
          >
            <QrCode className="w-4 h-4" />
            <span>Scan Barcode (Lama)</span>
          </Button>
          <PermissionGuard permission={PERMISSIONS.CREATE_ROM}>
            <Button
              variant="outline"
              className="shrink-0 gap-2"
              onClick={() => setCreateModalOpen(true)}
            >
              <Truck className="w-4 h-4" />
              <span>Tambah Manual</span>
            </Button>
          </PermissionGuard>
        </div>
      </div>

      {/* Global Filters */}
      <div className="flex flex-wrap items-center gap-3 bg-card p-3 rounded-lg border">
        <DateRangePicker date={dateRange} setDate={setDateRange} />
        <Select value={shift} onValueChange={setShift}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Pilih Shift" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Shift</SelectItem>
            <SelectItem value="1">Shift 1 (06:00 - 18:00)</SelectItem>
            <SelectItem value="2">Shift 2 (18:00 - 06:00)</SelectItem>
          </SelectContent>
        </Select>
        <Button
          onClick={handleRefresh}
          disabled={isLoading}
          className="whitespace-nowrap"
        >
          Terapkan
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full justify-start overflow-x-auto scrollbar-hide">
          <TabsTrigger value="overview" disabled={isLoading} className="gap-2">
            <LayoutDashboard className="w-4 h-4" /> Overview
          </TabsTrigger>
          <TabsTrigger value="data" disabled={isLoading} className="gap-2">
            <List className="w-4 h-4" /> Semua Data
          </TabsTrigger>
          <TabsTrigger value="analytics" disabled={isLoading} className="gap-2">
            <BarChart3 className="w-4 h-4" /> Analitik
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="overview">
            <div className="flex justify-end mb-4">
              <Button
                variant="outline"
                size="sm"
                disabled={isLoading}
                onClick={handleRefresh}
                className="gap-2"
              >
                <RefreshCw className="w-4 h-4" /> Perbarui Overview
              </Button>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Tonase
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {analytics?.totalTonnage || 0} MT
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Berdasarkan {totalItems} Data terfilter
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Ritase
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {analytics?.totalRitase || 0} Rit
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Aktif di{" "}
                    {shift === "all" ? "Semua Shift" : `Shift ${shift}`}
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-4">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-sm font-medium">
                    Tren Pengeluaran Harian
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analytics?.chartData || []}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis
                          dataKey="label"
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
                        <YAxis
                          yAxisId="right"
                          orientation="right"
                          stroke="#888888"
                          fontSize={12}
                          tickLine={false}
                          axisLine={false}
                        />
                        <Tooltip />
                        <Legend />
                        <Bar
                          yAxisId="left"
                          dataKey="Tonase"
                          fill="#2563eb"
                          radius={[4, 4, 0, 0]}
                        />
                        <Bar
                          yAxisId="right"
                          dataKey="Ritase"
                          fill="#f59e0b"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">
                    10 Penerimaan Terakhir
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <TableSkeleton columnCount={3} rowCount={5} />
                  ) : (
                    <Table>
                      <TableHeader>
                      <TableRow>
                        <TableHead>No. DO</TableHead>
                        <TableHead>Truk / Hull No</TableHead>
                        <TableHead className="text-right">
                          Tonase (MT)
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentData.slice(0, 10).map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">
                            {item.no_do || "-"}
                          </TableCell>
                          <TableCell>{item.hull_no || "-"}</TableCell>
                          <TableCell className="text-right">
                            {item.net_weight || 0}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="data" className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between gap-4 w-full">
              <div className="relative w-full sm:max-w-xs">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Cari ID, Truk, Supir..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button variant="outline" className="gap-2 shrink-0" onClick={handleExportExcel}>
                  <FileSpreadsheet className="w-4 h-4 text-green-600" />
                  <span className="hidden sm:inline">Excel</span>
                </Button>
                <Button variant="outline" className="gap-2 shrink-0" onClick={handleExportPdf}>
                  <FileText className="w-4 h-4 text-red-600" />
                  <span className="hidden sm:inline">PDF</span>
                </Button>
                <AdvancedFilterPopover
                  data={paginatedData}
                  filters={advancedFilters}
                  onFiltersChange={setAdvancedFilters}
                  showStatus={true}
                />
                <Button variant="outline" size="icon" onClick={handleRefresh}>
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <Card>
              <CardContent className="p-0">
                {isLoading ? (
                  <div className="p-4">
                    <TableSkeleton columnCount={11} rowCount={10} />
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]">No.</TableHead>
                      <TableHead>No. DO</TableHead>
                      <TableHead>Tanggal Shift</TableHead>
                      <TableHead>Waktu</TableHead>
                      <TableHead>Truk (Hull No)</TableHead>
                      <TableHead>Lot / Tipe</TableHead>
                      <TableHead>Asal (Loading)</TableHead>
                      <TableHead>Tujuan (Dumping)</TableHead>
                      <TableHead className="text-right">
                        Net Weight (Ton)
                      </TableHead>
                      <TableHead className="text-center">Status</TableHead>
                      <TableHead className="text-center">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredData.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={11} className="h-64 text-center">
                          <EmptyState
                            title="Data Pengiriman Kosong"
                            description="Belum ada catatan pengeluaran ROM atau tidak ada yang cocok dengan kriteria pencarian Anda."
                            actionLabel={searchQuery ? "Hapus Pencarian" : null}
                            onAction={
                              searchQuery ? () => setSearchQuery("") : undefined
                            }
                          />
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredData.map((item, index) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium text-muted-foreground">
                            {(currentPage - 1) * numericItemsPerPage +
                              index +
                              1}
                          </TableCell>
                          <TableCell className="font-medium">
                            {item.no_do || "-"}
                          </TableCell>
                          <TableCell>
                            {item.date_shift || item.date || "-"}
                          </TableCell>
                          <TableCell>
                            {item.time ? item.time.substring(0, 5) : "-"}
                          </TableCell>
                          <TableCell>{item.hull_no || "-"}</TableCell>
                          <TableCell>
                            {item.lot || "-"}
                            {item.coal_type && (
                              <span className="block text-xs text-muted-foreground">
                                {item.coal_type}
                              </span>
                            )}
                          </TableCell>
                          <TableCell>{item.loading || "-"}</TableCell>
                          <TableCell>{item.dumping || "-"}</TableCell>
                          <TableCell className="text-right font-medium">
                            {item.net_weight || 0} Ton
                          </TableCell>
                          <TableCell className="text-center">
                            <span
                              className={`px-2 py-1 rounded text-xs ${
                                item.finish?.status === "FINISH"
                                  ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                  : item.finish?.status === "REGISTERED"
                                  ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                                  : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                              }`}
                            >
                              {item.finish?.status || "IN_TRANSIT"}
                            </span>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-2">
                               {item.finish?.status === "REGISTERED" && (
                                <PermissionGuard permission={PERMISSIONS.CREATE_ROM}>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setMatchSjbModalOpen(true);
                                    }}
                                    className="h-8 gap-1 text-indigo-600 border-indigo-200 hover:bg-indigo-50 dark:hover:text-gray-900"
                                  >
                                    <LinkIcon className="h-3 w-3" />
                                    Match SJB
                                  </Button>
                                </PermissionGuard>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDetail(item)}
                                className="h-8 w-8 text-blue-600"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              {/* Tombol Match SJB per-baris untuk REGISTERED */}
                             
                              <PermissionGuard
                                permission={PERMISSIONS.EDIT_ROM}
                              >
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEdit(item)}
                                  className="h-8 w-8 text-amber-600"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </PermissionGuard>
                              <PermissionGuard
                                permission={PERMISSIONS.DELETE_ROM}
                              >
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDelete(item)}
                                  className="h-8 w-8 text-red-600"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </PermissionGuard>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
                )}
              </CardContent>
            </Card>

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              itemsPerPage={itemsPerPage}
              onItemsPerPageChange={(val) => {
                setItemsPerPage(val);
                setCurrentPage(1);
              }}
              totalItems={totalItems}
            />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <div className="flex justify-end mb-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                className="gap-2"
              >
                <RefreshCw className="w-4 h-4" /> Perbarui Analitik
              </Button>
            </div>
            <AnalyticsDashboard
              contractorData={[]} // Mock empty data for now
              hourlyData={chartView === "hourly" ? dashboardTimeData : []}
              dailyData={chartView === "daily" ? dashboardTimeData : []}
              shipments={[]}
              isLoading={isLoading}
              dateRange={{
                startDate: dashboardDateRange?.from,
                endDate: dashboardDateRange?.to,
              }}
              chartView={chartView}
              onChartViewChange={setAnalyticsView}
            />
          </TabsContent>
        </div>
      </Tabs>

      <QrScannerModal
        open={isScannerOpen}
        onOpenChange={setIsScannerOpen}
        onScan={handleScan}
        title="Scan Barcode Truk / Alat"
        description="Arahkan kamera ke QR Code pada unit armada."
      />

      <ManualInputDialog
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        title="Tambah Pengeluaran ROM (Manual)"
        description="Ketik atau paste kode barcode dari surat jalan untuk mencatat pengeluaran baru."
        placeholder="Contoh: 02166C0326W3572F196   A1500A"
        submitLabel="Catat Pengeluaran"
        isLoading={isCreating}
        onSubmit={async (value) => {
          setIsCreating(true);
          const res = await useRomStore.getState().createItem({ no_do: value });
          setIsCreating(false);
          if (res?.success) {
            toast.success("Berhasil mencatat Pengeluaran ROM!");
            setCreateModalOpen(false);
          } else {
            toast.error(`Gagal mencatat data: ${res?.error || ""}`);
          }
        }}
      />

      {/* Step 1: Register DT */}
      <RegisterShipmentDialog
        open={registerModalOpen}
        onOpenChange={setRegisterModalOpen}
        isLoading={isRegistering}
        onSubmit={async (payload) => {
          setIsRegistering(true);
          const res = await useRomStore.getState().registerItem(payload);
          setIsRegistering(false);
          if (res?.success) {
            toast.success("DT berhasil didaftarkan!");
            setRegisterModalOpen(false);
          } else {
            toast.error(`Gagal mendaftarkan DT: ${res?.error || ""}`);
          }
        }}
      />

      {/* Step 2: Match SJB */}
      <MatchSjbDialog
        open={matchSjbModalOpen}
        onOpenChange={setMatchSjbModalOpen}
        isLoading={isMatchingSjb}
        onSubmit={async (noDo) => {
          setIsMatchingSjb(true);
          const res = await useRomStore.getState().matchSjbItem(noDo);
          setIsMatchingSjb(false);
          if (res?.success) {
            toast.success("SJB berhasil di-match dengan DT!");
            setMatchSjbModalOpen(false);
          } else {
            toast.error(`Gagal match SJB: ${res?.error || ""}`);
          }
        }}
      />

      {/* --- MODALS --- */}
      {/* View Detail Modal diganti dengan ShipmentDetailDialog */}
      <ShipmentDetailDialog
        open={viewModalOpen}
        onClose={() => setViewModalOpen(false)}
        item={selectedItem}
        mode="rom"
        onPhotoUpdated={() => {
          // Refresh overview setelah foto diganti
          useRomStore.getState().fetchOverview();
        }}
      />

      {/* Edit Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Pengiriman ROM</DialogTitle>
            <DialogDescription>
              Ubah data untuk pengiriman {selectedItem?.no_do}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">No. DO</label>
              <Input
                value={editFields.no_do || ""}
                onChange={(e) =>
                  setEditFields((f) => ({ ...f, no_do: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Hull No</label>
              <Input
                value={editFields.hull_no || ""}
                onChange={(e) =>
                  setEditFields((f) => ({ ...f, hull_no: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">No. Segel (Seal No)</label>
              <Input
                value={editFields.seal_no || ""}
                onChange={(e) =>
                  setEditFields((f) => ({ ...f, seal_no: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Tipe Batubara</label>
              <Input
                value={editFields.coal_type || ""}
                onChange={(e) =>
                  setEditFields((f) => ({ ...f, coal_type: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Lot</label>
              <Input
                value={editFields.lot || ""}
                onChange={(e) =>
                  setEditFields((f) => ({ ...f, lot: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Net Weight (Ton)</label>
              <Input
                type="number"
                value={editFields.net_weight || ""}
                onChange={(e) =>
                  setEditFields((f) => ({ ...f, net_weight: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-amber-600">
                Alasan Perubahan <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="Contoh: Koreksi salah input bobot dari lapangan"
                value={editReason}
                onChange={(e) => setEditReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditModalOpen(false)}>
              Batal
            </Button>
            <Button onClick={confirmEdit}>Simpan Perubahan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Modal */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus Pengiriman</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus data pengiriman{" "}
              <strong>{selectedItem?.no_do}</strong>? Tindakan ini tidak dapat
              dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 mt-2">
            <label className="text-sm font-medium text-red-600">
              Alasan Penghapusan <span className="text-red-500">*</span>
            </label>
            <Input
              placeholder="Contoh: Data duplikat / kesalahan input"
              value={deleteReason}
              onChange={(e) => setDeleteReason(e.target.value)}
            />
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setDeleteModalOpen(false)}>
              Batal
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Hapus Data
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function LayoutDashboard({ className }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect width="7" height="9" x="3" y="3" rx="1" />
      <rect width="7" height="5" x="14" y="3" rx="1" />
      <rect width="7" height="9" x="14" y="12" rx="1" />
      <rect width="7" height="5" x="3" y="16" rx="1" />
    </svg>
  );
}
