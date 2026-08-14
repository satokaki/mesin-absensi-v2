import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Users, Phone, Mail } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useCompany } from "@/lib/CompanyContext";
import { companyFilter, companyPayload } from "@/lib/tenant";
import { withGeneratedCode } from "@/lib/codeGenerator";

export default function DataKaryawan() {
  const { toast } = useToast();
  const { activeCompany } = useCompany();
  const [list, setList] = useState([]);
  const [cabang, setCabang] = useState([]);
  const [departemen, setDepartemen] = useState([]);
  const [jabatan, setJabatan] = useState([]);
  const [shift, setShift] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ nik: "", nama_lengkap: "", email: "", telepon: "", jenis_kelamin: "L", tanggal_masuk: new Date().toISOString().split("T")[0], gaji_pokok: 0, status: "aktif", cabang_id: "", departemen_id: "", jabatan_id: "", shift_id: "" });
  const [busy, setBusy] = useState(false);

  const loadData = async () => {
    if (!activeCompany?.id) {
      setList([]); setCabang([]); setDepartemen([]); setJabatan([]); setShift([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const [k, c, d, j, s] = await Promise.all([
        base44.entities.Karyawan.filter(companyFilter(activeCompany), "-created_date", 100),
        base44.entities.Cabang.filter(companyFilter(activeCompany)),
        base44.entities.Departemen.filter(companyFilter(activeCompany)),
        base44.entities.Jabatan.filter(companyFilter(activeCompany)),
        base44.entities.Shift.filter(companyFilter(activeCompany)),
      ]);
      setList(k); setCabang(c); setDepartemen(d); setJabatan(j); setShift(s);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, [activeCompany?.id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const cab = cabang.find((c) => c.id === form.cabang_id);
      const dep = departemen.find((d) => d.id === form.departemen_id);
      const jab = jabatan.find((j) => j.id === form.jabatan_id);
      const sh = shift.find((s) => s.id === form.shift_id);
      const payload = companyPayload(activeCompany, {
        ...form,
        gaji_pokok: Number(form.gaji_pokok),
        cabang_nama: cab?.nama,
        departemen_nama: dep?.nama,
        jabatan_nama: jab?.nama,
        shift_nama: sh?.nama,
      });
      await base44.entities.Karyawan.create(
        withGeneratedCode("karyawan", "nik", activeCompany, payload)
      );
      toast({ title: "Karyawan ditambahkan" });
      setOpen(false);
      setForm({ nik: "", nama_lengkap: "", email: "", telepon: "", jenis_kelamin: "L", tanggal_masuk: new Date().toISOString().split("T")[0], gaji_pokok: 0, status: "aktif", cabang_id: "", departemen_id: "", jabatan_id: "", shift_id: "" });
      loadData();
    } catch (e) {
      toast({ title: "Gagal menambahkan", variant: "destructive" });
    } finally { setBusy(false); }
  };

  const filtered = list.filter((k) =>
    !search || k.nama_lengkap?.toLowerCase().includes(search.toLowerCase()) || k.nik?.includes(search)
  );

  if (loading) return <div className="p-8 flex justify-center"><div className="w-8 h-8 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin" /></div>;

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      <PageHeader title="Data Karyawan" subtitle={`${list.length} karyawan terdaftar`}>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button className="bg-indigo-600 hover:bg-indigo-700"><Plus className="w-4 h-4 mr-1.5" /> Tambah Karyawan</Button></DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Tambah Karyawan</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Kode Karyawan / NIK</Label><Input placeholder="Otomatis jika kosong" value={form.nik} onChange={(e) => setForm({ ...form, nik: e.target.value })} /></div>
                <div><Label>Nama Lengkap</Label><Input required value={form.nama_lengkap} onChange={(e) => setForm({ ...form, nama_lengkap: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
                <div><Label>Telepon</Label><Input value={form.telepon} onChange={(e) => setForm({ ...form, telepon: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Jenis Kelamin</Label>
                  <Select value={form.jenis_kelamin} onValueChange={(v) => setForm({ ...form, jenis_kelamin: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="L">Laki-laki</SelectItem><SelectItem value="P">Perempuan</SelectItem></SelectContent>
                  </Select>
                </div>
                <div><Label>Tanggal Masuk</Label><Input type="date" value={form.tanggal_masuk} onChange={(e) => setForm({ ...form, tanggal_masuk: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Cabang</Label>
                  <Select value={form.cabang_id} onValueChange={(v) => setForm({ ...form, cabang_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Pilih" /></SelectTrigger>
                    <SelectContent>{cabang.map((c) => <SelectItem key={c.id} value={c.id}>{c.nama}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Departemen</Label>
                  <Select value={form.departemen_id} onValueChange={(v) => setForm({ ...form, departemen_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Pilih" /></SelectTrigger>
                    <SelectContent>{departemen.map((d) => <SelectItem key={d.id} value={d.id}>{d.nama}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Jabatan</Label>
                  <Select value={form.jabatan_id} onValueChange={(v) => setForm({ ...form, jabatan_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Pilih" /></SelectTrigger>
                    <SelectContent>{jabatan.map((j) => <SelectItem key={j.id} value={j.id}>{j.nama}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Shift</Label>
                  <Select value={form.shift_id} onValueChange={(v) => setForm({ ...form, shift_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Pilih" /></SelectTrigger>
                    <SelectContent>{shift.map((s) => <SelectItem key={s.id} value={s.id}>{s.nama}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Gaji Pokok</Label><Input type="number" value={form.gaji_pokok} onChange={(e) => setForm({ ...form, gaji_pokok: e.target.value })} /></div>
                <div><Label>Status</Label>
                  <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="aktif">Aktif</SelectItem><SelectItem value="nonaktif">Nonaktif</SelectItem><SelectItem value="cuti">Cuti</SelectItem></SelectContent>
                  </Select>
                </div>
              </div>
              <Button type="submit" disabled={busy} className="w-full bg-indigo-600 hover:bg-indigo-700">Simpan</Button>
            </form>
          </DialogContent>
        </Dialog>
      </PageHeader>

      <div className="relative mb-6 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input placeholder="Cari nama atau NIK..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.length === 0 && (
          <div className="col-span-full text-center py-16">
            <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-400">Belum ada karyawan</p>
          </div>
        )}
        {filtered.map((k) => (
          <div key={k.id} className="bg-white rounded-2xl border border-slate-200/70 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white font-bold">
                {k.nama_lengkap?.charAt(0) || "?"}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-slate-900 truncate">{k.nama_lengkap}</h3>
                <p className="text-xs text-slate-500">NIK: {k.nik}</p>
              </div>
              <span className={`px-2 py-1 rounded-full text-[10px] font-medium ${k.status === "aktif" ? "bg-emerald-50 text-emerald-700" : k.status === "cuti" ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-500"}`}>{k.status}</span>
            </div>
            <div className="mt-4 space-y-1.5 text-xs text-slate-500">
              <p className="flex items-center gap-2"><Mail className="w-3.5 h-3.5" /> {k.email || "-"}</p>
              <p className="flex items-center gap-2"><Phone className="w-3.5 h-3.5" /> {k.telepon || "-"}</p>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-600 font-medium">{k.jabatan_nama || "-"}</span>
              <span className="text-slate-400">{k.departemen_nama || "-"}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
