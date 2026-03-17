import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/shared/components/ui/dialog";
import { Input } from "@/shared/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Database, Plus, Edit, Trash2, Users, Search, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { userService } from "../services/userService";

export default function MasterDataPage() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    role: "",
  });

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const res = await userService.getUsers({ search: searchQuery });
      if (res.success) setUsers(res.data);
    } catch (error) {
      toast.error("Gagal mengambil data user");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const rolesData = await userService.getRoles();
      setRoles(rolesData);
    } catch (error) {
      console.error("Gagal mengambil roles", error);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, [searchQuery]);

  const handleOpenModal = (user = null) => {
    if (user) {
      setSelectedUser(user);
      setFormData({
        username: user.username,
        email: user.email,
        password: "", // Kosongkan password saat edit
        role: user.role?.id?.toString() || "",
      });
    } else {
      setSelectedUser(null);
      setFormData({ username: "", email: "", password: "", role: "" });
    }
    setModalOpen(true);
  };

  const handleSave = async () => {
    try {
      const payload = { ...formData };
      if (!payload.password && selectedUser) {
        delete payload.password; // Jangan kirim password kosong saat edit
      }

      if (selectedUser) {
        await userService.updateUser(selectedUser.id, payload);
        toast.success("User berhasil diupdate");
      } else {
        await userService.createUser(payload);
        toast.success("User berhasil ditambahkan");
      }
      setModalOpen(false);
      fetchUsers();
    } catch (error) {
      toast.error("Gagal menyimpan user");
    }
  };

  const handleDelete = async () => {
    if (!selectedUser) return;
    try {
      await userService.deleteUser(selectedUser.id);
      toast.success("User berhasil dihapus");
      setDeleteModalOpen(false);
      fetchUsers();
    } catch (error) {
      toast.error("Gagal menghapus user");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Master Data</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Pengelolaan user, role, dan konfigurasi master lainnya (Admin).
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {/* Module cards template */}
        <Card className="hover:shadow-md transition-shadow cursor-pointer border-primary/50 bg-primary/5">
          <CardHeader className="flex flex-row items-center gap-4">
            <div className="p-2 bg-primary/20 text-primary rounded-lg shrink-0">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <CardTitle className="text-lg">Manajemen User</CardTitle>
              <p className="text-sm text-muted-foreground">
                Daftar admin, checker, dan supir
              </p>
            </div>
          </CardHeader>
        </Card>
      </div>

      {/* User Management Section */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <CardTitle>Daftar User Aplikasi</CardTitle>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari user..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button variant="outline" size="icon" onClick={fetchUsers}>
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
            <Button className="gap-2" onClick={() => handleOpenModal()}>
              <Plus className="w-4 h-4" />
              <span>Tambah User</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Tidak ada data user ditemukan.
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.id}</TableCell>
                    <TableCell className="font-medium">{user.username}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <span className="px-2 py-1 bg-secondary text-secondary-foreground rounded text-xs font-medium">
                        {user.role?.name || "No Role"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleOpenModal(user)}>
                        <Edit className="w-4 h-4 text-amber-600" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => { setSelectedUser(user); setDeleteModalOpen(true); }}>
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modal Add/Edit */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedUser ? "Edit User" : "Tambah User Baru"}</DialogTitle>
            <DialogDescription>
              Isi data kredensial akses pengguna. Role wajib dipilih.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Username</label>
              <Input
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Password {selectedUser && "(Kosongkan jika tidak ingin ubah)"}</label>
              <Input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Role</label>
              <Select value={formData.role} onValueChange={(val) => setFormData({ ...formData, role: val })}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map(r => (
                    <SelectItem key={r.id} value={r.id.toString()}>{r.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Batal</Button>
            <Button onClick={handleSave}>Simpan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Delete */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus User</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus user <strong>{selectedUser?.username}</strong>?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setDeleteModalOpen(false)}>Batal</Button>
            <Button variant="destructive" onClick={handleDelete}>Hapus</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
