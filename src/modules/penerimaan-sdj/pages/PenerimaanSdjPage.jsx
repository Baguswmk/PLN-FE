import React, {useEffect, useState, useMemo} from "react";
import { startOfMonth, endOfMonth } from "date-fns";
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
  PictureInPicture,
  BarChart3,
  List,
  QrCode,
  Eye,
  Edit,
  Trash2,
  Search,
  Filter,
  RefreshCw,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import Pagination from "@/shared/components/navigation/Pagination";
import QrScannerModal from "@/shared/components/dialogs/QrScannerModal";
import { useSdjStore } from "../store/useSdjStore";
import PermissionGuard from "@/shared/components/guard/PermissionGuard";
import { PERMISSIONS } from "@/config/permissions";

export default function PenerimaanSdjPage() {
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
  } = useSdjStore();

  // Mount: fetch overview (tab default)
  useEffect(() => {
    useSdjStore.getState().fetchOverview();
  }, []);

  const chartView = analyticsView || "daily";
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  // Edit form state
  const [editFields, setEditFields] = useState({});
  const [editReason, setEditReason] = useState("");
  const [deleteReason, setDeleteReason] = useState("");

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
    toast.loading("Mencetak penerimaan SDJ...", { id: "scan-toast" });
    try {
      const updateRes = await useSdjStore.getState().updateItemByNoDo(result, {
        status: "FINISH",
        edit_reason: "Scan QR Penerimaan SDJ"
      });
      
      if (updateRes.success) {
        toast.success("Penerimaan SDJ berhasil dicatat!", { id: "scan-toast" });
      } else {
        toast.error(`Gagal memperbarui: ${updateRes?.error || ""}`, { id: "scan-toast" });
      }
    } catch {
      toast.error("Terjadi kesalahan sistem.", { id: "scan-toast" });
    }
  };

  const numericItemsPerPage =
    itemsPerPage === "All" || itemsPerPage === totalItems
      ? totalItems
      : itemsPerPage;
  const totalPages = Math.max(1, Math.ceil(totalItems / numericItemsPerPage));

  const handleDetail = (item) => {
    setSelectedItem(item);
    setViewModalOpen(true);
  };

  // const formCreate = useForm({
  //   resolver: zodResolver(createSdjSchema),
  //   mode: "onBlur",
  //   defaultValues: {
  //     date_shift: null,
  //     shift: "",
  //     lot: "",
  //     no_do: "",
  //     coal_type: "CRUSHED",
  //     hull_no: "",
  //     loading: "",
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

  const { updateItem } = useSdjStore();

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
          `Berhasil menghapus SDJ ${selectedItem?.no_do || selectedItem?.id}`,
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Penerimaan SDJ</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Pantau penerimaan batubara dan konfirmasi kedatangan truk.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="gap-2 shrink-0"
            onClick={() => setIsScannerOpen(true)}
          >
            <QrCode className="w-4 h-4" />
            <span>Scan Barcode</span>
          </Button>
          <PermissionGuard permission={PERMISSIONS.CREATE_SDJ}>
            <Button
              className="gap-2 shrink-0"
              onClick={() =>
                toast.info("Fitur Formulir Penerimaan Manual akan segera hadir")
              }
            >
              <PictureInPicture className="w-4 h-4" />
              <span>Penerimaan Manual</span>
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
            <PictureInPicture className="w-4 h-4" /> Overview
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
                    Total Penerimaan Hari Ini
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
                    Tren Penerimaan Harian
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analytics?.chartData || []}>
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
                <Button variant="outline" className="gap-2 shrink-0">
                  <Filter className="w-4 h-4" />
                  <span>Filter Lanjutan</span>
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleRefresh}
                >
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <Card>
              <CardContent className="p-0">
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
                    {paginatedData.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="h-64 text-center">
                          <EmptyState
                            title="Data Penerimaan Kosong"
                            description="Belum ada catatan penerimaan SDJ atau tidak ada yang sesuai dengan pencarian."
                            actionLabel={searchQuery ? "Hapus Pencarian" : null}
                            onAction={
                              searchQuery ? () => setSearchQuery("") : undefined
                            }
                          />
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedData.map((item, index) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium text-muted-foreground">
                            {(currentPage - 1) * numericItemsPerPage +
                              index +
                              1}
                          </TableCell>
                          <TableCell className="font-medium">
                            {item.no_do}
                          </TableCell>
                          <TableCell>{item.date_shift || item.date || "-"}</TableCell>
                          <TableCell>{item.time ? item.time.substring(0, 5) : "-"}</TableCell>
                          <TableCell>{item.hull_no || "-"}</TableCell>
                          <TableCell>
                            {item.lot || "-"}
                            {item.coal_type && <span className="block text-xs text-muted-foreground">{item.coal_type}</span>}
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
                                  : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                              }`}
                            >
                              {item.finish?.status || "IN_TRANSIT"}
                            </span>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDetail(item)}
                                className="h-8 w-8 text-blue-600"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <PermissionGuard
                                permission={PERMISSIONS.EDIT_SDJ}
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
                                permission={PERMISSIONS.DELETE_SDJ}
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
        title="Scan Surat Jalan (SDJ)"
        description="Arahkan kamera ke QR Code pada dokumen Surat Jalan."
      />

      {/* --- MODALS --- */}
      {/* View Detail Modal */}
      <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detail Penerimaan SDJ</DialogTitle>
            <DialogDescription>
              Informasi lengkap untuk dokumen SDJ {selectedItem?.id}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 text-sm mt-4">
            <div className="grid grid-cols-2 gap-2">
              <span className="text-muted-foreground">ID DB:</span>
              <span className="font-medium">{selectedItem?.id}</span>
              <span className="text-muted-foreground">No. DO:</span>
              <span className="font-medium">{selectedItem?.no_do || "-"}</span>
              <span className="text-muted-foreground">Tanggal Shift:</span>
              <span className="font-medium">
                {selectedItem?.date_shift || selectedItem?.date || "-"}
              </span>
              <span className="text-muted-foreground">Waktu:</span>
              <span className="font-medium">{selectedItem?.time || "-"}</span>
              <span className="text-muted-foreground">Tipe Batubara:</span>
              <span className="font-medium">{selectedItem?.coal_type || "-"}</span>
              <span className="text-muted-foreground">Truk (Hull No):</span>
              <span className="font-medium">{selectedItem?.hull_no || "-"}</span>
              <span className="text-muted-foreground">Supir:</span>
              <span className="font-medium">{selectedItem?.username || "-"}</span>
              <span className="text-muted-foreground">Lokasi Loading:</span>
              <span className="font-medium">{selectedItem?.loading || "-"}</span>
              <span className="text-muted-foreground">Lokasi Dumping:</span>
              <span className="font-medium">{selectedItem?.dumping || "-"}</span>
              <span className="text-muted-foreground">Lot:</span>
              <span className="font-medium">{selectedItem?.lot || "-"}</span>
              <span className="text-muted-foreground">Net Weight (Ton):</span>
              <span className="font-medium">{selectedItem?.net_weight || 0}</span>
              <span className="text-muted-foreground">Status:</span>
              <span className="font-medium">
                {selectedItem?.finish?.status || "IN_TRANSIT"}
              </span>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setViewModalOpen(false)}>Tutup</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Penerimaan SDJ</DialogTitle>
            <DialogDescription>
              Ubah data untuk dokumen {selectedItem?.no_do}
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
            <DialogTitle>Hapus Dokumen SDJ</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus dokumen{" "}
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
