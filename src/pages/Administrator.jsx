import React, { useEffect, useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Shield, UserPlus, Users, Database, Download, Upload, ScrollText, RefreshCw, Settings2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/lib/AuthContext";
import { useCompany } from "@/lib/CompanyContext";
import {
  MENU_PERMISSION_OPTIONS,
  ROLE_LABELS,
  getRoleDefaultPermissions,
  normalizeMenuPermissions,
  resolveMenuPermissions,
} from "@/lib/permissions";

const GROUPS = ["Utama", "Manajemen", "Sistem"];

export default function Administrator() {
  const { toast } = useToast();
  const { user } = useAuth();
  const { activeCompany } = useCompany();
  const [users, setUsers] = useState([]);
  const [memberships, setMemberships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [accessOpen, setAccessOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [accessForm, setAccessForm] = useState({
    role: "karyawan",
    status: "aktif",
    menu_permissions: getRoleDefaultPermissions("karyawan"),
  });

  const membershipByUser = useMemo(
    () => Object.fromEntries(memberships.map((membership) => [membership.user_id, membership])),
    [memberships]
  );

  const loadUsers = async () => {
    setLoading(true);
    try {
      const [userList, companyMemberships] = await Promise.all([
        base44.entities.User.list(),
        activeCompany?.id
          ? base44.entities.UserCompany.filter({ company_id: activeCompany.id })
          : Promise.resolve([]),
      ]);
      setUsers(userList || []);
      setMemberships(companyMemberships || []);
    } catch (error) {
      console.error(error);
      toast({ title: "Gagal memuat user dan hak akses", description: error?.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadUsers(); }, [activeCompany?.id]);

  const handleInvite = async (event) => {
    event.preventDefault();
    setBusy(true);
    try {
      await base44.users.inviteUser(inviteEmail, "user");
      toast({
        title: "Undangan terkirim",
        description: "Setelah user menerima undangan, atur perusahaan, role, dan menu melalui tombol Hak Akses.",
      });
      setInviteOpen(false);
      setInviteEmail("");
      await loadUsers();
    } catch (error) {
      toast({ title: "Gagal mengundang", description: error.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const openAccess = (targetUser) => {
    const membership = membershipByUser[targetUser.id];
    const role = membership?.role || "karyawan";
    const permissions = Array.isArray(membership?.menu_permissions)
      ? normalizeMenuPermissions(membership.menu_permissions)
      : getRoleDefaultPermissions(role);

    setSelectedUser(targetUser);
    setAccessForm({
      role,
      status: membership?.status || "aktif",
      menu_permissions: permissions,
    });
    setAccessOpen(true);
  };

  const changeRole = (role) => {
    setAccessForm({
      ...accessForm,
      role,
      menu_permissions: getRoleDefaultPermissions(role),
    });
  };

  const togglePermission = (permission, checked) => {
    setAccessForm((current) => ({
      ...current,
      menu_permissions: checked
        ? [...new Set([...current.menu_permissions, permission])]
        : current.menu_permissions.filter((item) => item !== permission),
    }));
  };

  const saveAccess = async () => {
    if (!selectedUser?.id || !activeCompany?.id) return;
    setBusy(true);
    try {
      const existing = membershipByUser[selectedUser.id];
      const payload = {
        user_id: selectedUser.id,
        company_id: activeCompany.id,
        company_nama: activeCompany.nama,
        role: accessForm.role,
        status: accessForm.status,
        is_default: existing?.is_default ?? memberships.length === 0,
        menu_permissions: normalizeMenuPermissions(accessForm.menu_permissions),
      };

      if (existing) await base44.entities.UserCompany.update(existing.id, payload);
      else await base44.entities.UserCompany.create(payload);

      toast({ title: "Hak akses disimpan", description: `${selectedUser.email} · ${activeCompany.nama}` });
      setAccessOpen(false);
      await loadUsers();
    } catch (error) {
      toast({ title: "Gagal menyimpan hak akses", description: error?.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const adminActions = [
    { label: "Backup Data", icon: Database, desc: "Cadangkan seluruh data sistem" },
    { label: "Restore Data", icon: RefreshCw, desc: "Pulihkan dari cadangan" },
    { label: "Import Data", icon: Upload, desc: "Import data dari file CSV/Excel" },
    { label: "Export Data", icon: Download, desc: "Export seluruh data ke file" },
  ];

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      <PageHeader title="Administrator" subtitle="Manajemen user, role, dan hak akses menu" />

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {adminActions.map(({ label, icon: Icon, desc }) => (
          <button key={label} onClick={() => toast({ title: `${label} - Fitur akan tersedia` })} className="bg-white rounded-2xl border border-slate-200/70 p-5 text-left hover:shadow-md hover:-translate-y-0.5 transition-all">
            <div className="w-11 h-11 rounded-xl bg-slate-900 flex items-center justify-center mb-3"><Icon className="w-5 h-5 text-white" /></div>
            <h3 className="font-semibold text-slate-900 text-sm">{label}</h3>
            <p className="text-xs text-slate-500 mt-1">{desc}</p>
          </button>
        ))}
      </div>

      {!activeCompany && (
        <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Pilih atau buat perusahaan terlebih dahulu sebelum mengatur hak akses user.
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200/70 overflow-hidden">
        <div className="flex items-center justify-between gap-4 p-5 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-slate-600" />
              <h3 className="font-semibold text-slate-900">Daftar User</h3>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Hak akses untuk: <span className="font-medium text-slate-700">{activeCompany?.nama || "Belum ada perusahaan"}</span>
            </p>
          </div>
          <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
            <DialogTrigger asChild><Button className="bg-indigo-600 hover:bg-indigo-700"><UserPlus className="w-4 h-4 mr-1.5" /> Undang User</Button></DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader><DialogTitle>Undang User Baru</DialogTitle></DialogHeader>
              <form onSubmit={handleInvite} className="space-y-3">
                <div><Label>Email</Label><Input type="email" required value={inviteEmail} onChange={(event) => setInviteEmail(event.target.value)} placeholder="nama@perusahaan.com" /></div>
                <p className="text-xs text-slate-500">User baru selalu diundang sebagai User. Role perusahaan dan menu ditentukan setelah undangan diterima.</p>
                <Button type="submit" disabled={busy} className="w-full bg-indigo-600 hover:bg-indigo-700">Kirim Undangan</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="p-12 flex justify-center"><div className="w-8 h-8 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr className="text-left text-slate-500">
                  <th className="px-5 py-3 font-medium">Nama</th>
                  <th className="px-5 py-3 font-medium">Email</th>
                  <th className="px-5 py-3 font-medium">Role Perusahaan</th>
                  <th className="px-5 py-3 font-medium">Menu</th>
                  <th className="px-5 py-3 font-medium text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((targetUser) => {
                  const membership = membershipByUser[targetUser.id];
                  const globalAdmin = targetUser.role === "admin";
                  const permissionCount = resolveMenuPermissions(membership, globalAdmin).length;
                  return (
                    <tr key={targetUser.id} className="hover:bg-slate-50/50">
                      <td className="px-5 py-3 font-medium text-slate-900">{targetUser.full_name || "-"}</td>
                      <td className="px-5 py-3 text-slate-600">{targetUser.email}</td>
                      <td className="px-5 py-3">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${globalAdmin ? "bg-indigo-50 text-indigo-700" : "bg-slate-100 text-slate-600"}`}>
                          {globalAdmin ? "Super Admin" : membership ? ROLE_LABELS[membership.role] || membership.role : "Belum diatur"}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-slate-600">{globalAdmin ? "Semua menu" : `${permissionCount} menu`}</td>
                      <td className="px-5 py-3 text-right">
                        <Button size="sm" variant="outline" disabled={!activeCompany || globalAdmin} onClick={() => openAccess(targetUser)}>
                          <Settings2 className="w-4 h-4 mr-1.5" /> Hak Akses
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Dialog open={accessOpen} onOpenChange={setAccessOpen}>
        <DialogContent className="max-w-2xl max-h-[88vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Hak Akses User</DialogTitle></DialogHeader>
          <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
            <p className="font-medium text-slate-900">{selectedUser?.full_name || selectedUser?.email}</p>
            <p className="text-xs text-slate-500 mt-1">{selectedUser?.email} · {activeCompany?.nama}</p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label>Role Perusahaan</Label>
              <Select value={accessForm.role} onValueChange={changeRole}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(ROLE_LABELS).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status Akses</Label>
              <Select value={accessForm.status} onValueChange={(status) => setAccessForm({ ...accessForm, status })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="aktif">Aktif</SelectItem><SelectItem value="nonaktif">Nonaktif</SelectItem></SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-slate-200 pt-4">
            <div>
              <h3 className="font-semibold text-slate-900">Menu yang Diizinkan</h3>
              <p className="text-xs text-slate-500">Preset role dapat disesuaikan per user.</p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setAccessForm({ ...accessForm, menu_permissions: MENU_PERMISSION_OPTIONS.map((item) => item.key) })}>Semua</Button>
              <Button size="sm" variant="outline" onClick={() => setAccessForm({ ...accessForm, menu_permissions: [] })}>Kosongkan</Button>
            </div>
          </div>

          <div className="space-y-5">
            {GROUPS.map((group) => (
              <div key={group}>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">{group}</p>
                <div className="grid sm:grid-cols-2 gap-2">
                  {MENU_PERMISSION_OPTIONS.filter((item) => item.group === group).map((item) => (
                    <label key={item.key} className="flex items-center gap-3 rounded-lg border border-slate-200 p-3 cursor-pointer hover:bg-slate-50">
                      <Checkbox checked={accessForm.menu_permissions.includes(item.key)} onCheckedChange={(checked) => togglePermission(item.key, checked === true)} />
                      <span className="text-sm text-slate-700">{item.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <Button className="w-full" disabled={busy} onClick={saveAccess}>{busy ? "Menyimpan..." : "Simpan Hak Akses"}</Button>
        </DialogContent>
      </Dialog>

      <div className="mt-6 bg-slate-900 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-3 mb-3">
          <ScrollText className="w-5 h-5 text-indigo-300" />
          <h3 className="font-semibold">Audit Log</h3>
        </div>
        <div className="space-y-2 text-sm text-slate-300">
          <p className="flex items-center gap-2"><Shield className="w-3.5 h-3.5 text-emerald-400" /> Sesi login: {user?.email || "admin"}</p>
          <p className="text-slate-500 text-xs">Perubahan hak akses disimpan per user dan per perusahaan.</p>
        </div>
      </div>
    </div>
  );
}
