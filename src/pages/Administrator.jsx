import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Shield, UserPlus, Users, Database, Download, Upload, ScrollText, RefreshCw } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/lib/AuthContext";

export default function Administrator() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("user");

  const loadUsers = async () => {
    try { setUsers(await base44.entities.User.list()); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  };
  useEffect(() => { loadUsers(); }, []);

  const handleInvite = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await base44.users.inviteUser(inviteEmail, inviteRole);
      toast({ title: "Undangan terkirim", description: inviteEmail });
      setOpen(false); setInviteEmail(""); setInviteRole("user");
      loadUsers();
    } catch (e) {
      toast({ title: "Gagal mengundang", description: e.message, variant: "destructive" });
    } finally { setBusy(false); }
  };

  const adminActions = [
    { label: "Backup Data", icon: Database, desc: "Cadangkan seluruh data sistem" },
    { label: "Restore Data", icon: RefreshCw, desc: "Pulihkan dari cadangan" },
    { label: "Import Data", icon: Upload, desc: "Import data dari file CSV/Excel" },
    { label: "Export Data", icon: Download, desc: "Export seluruh data ke file" },
  ];

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      <PageHeader title="Administrator" subtitle="Manajemen user dan sistem" />

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {adminActions.map(({ label, icon: Icon, desc }) => (
          <button key={label} onClick={() => toast({ title: `${label} - Fitur akan tersedia` })} className="bg-white rounded-2xl border border-slate-200/70 p-5 text-left hover:shadow-md hover:-translate-y-0.5 transition-all">
            <div className="w-11 h-11 rounded-xl bg-slate-900 flex items-center justify-center mb-3"><Icon className="w-5 h-5 text-white" /></div>
            <h3 className="font-semibold text-slate-900 text-sm">{label}</h3>
            <p className="text-xs text-slate-500 mt-1">{desc}</p>
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/70 overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-slate-600" />
            <h3 className="font-semibold text-slate-900">Daftar User</h3>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button className="bg-indigo-600 hover:bg-indigo-700"><UserPlus className="w-4 h-4 mr-1.5" /> Undang User</Button></DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader><DialogTitle>Undang User Baru</DialogTitle></DialogHeader>
              <form onSubmit={handleInvite} className="space-y-3">
                <div><Label>Email</Label><Input type="email" required value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="nama@perusahaan.com" /></div>
                <div><Label>Role</Label>
                  <Select value={inviteRole} onValueChange={setInviteRole}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="user">User</SelectItem><SelectItem value="admin">Admin</SelectItem></SelectContent>
                  </Select>
                </div>
                <Button type="submit" disabled={busy} className="w-full bg-indigo-600 hover:bg-indigo-700">Kirim Undangan</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        {loading ? (
          <div className="p-12 flex justify-center"><div className="w-8 h-8 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin" /></div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr className="text-left text-slate-500">
                <th className="px-5 py-3 font-medium">Nama</th>
                <th className="px-5 py-3 font-medium">Email</th>
                <th className="px-5 py-3 font-medium">Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/50">
                  <td className="px-5 py-3 font-medium text-slate-900">{u.full_name || "-"}</td>
                  <td className="px-5 py-3 text-slate-600">{u.email}</td>
                  <td className="px-5 py-3"><span className={`px-2.5 py-1 rounded-full text-xs font-medium ${u.role === "admin" ? "bg-indigo-50 text-indigo-700" : "bg-slate-100 text-slate-600"}`}>{u.role}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="mt-6 bg-slate-900 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-3 mb-3">
          <ScrollText className="w-5 h-5 text-indigo-300" />
          <h3 className="font-semibold">Audit Log</h3>
        </div>
        <div className="space-y-2 text-sm text-slate-300">
          <p className="flex items-center gap-2"><Shield className="w-3.5 h-3.5 text-emerald-400" /> Sesi login: {user?.email || "admin"}</p>
          <p className="text-slate-500 text-xs">Aktivitas sistem akan tercatat otomatis di sini.</p>
        </div>
      </div>
    </div>
  );
}