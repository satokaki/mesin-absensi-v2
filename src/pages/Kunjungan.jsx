import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { MapPin, Plus, LogOut, CheckCircle, Clock } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

function formatTime(iso) {
  if (!iso) return "--:--";
  return new Date(iso).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
}

export default function Kunjungan() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ tujuan: "", alamat_kunjungan: "", pic_nama: "", pic_kontak: "", tanggal: new Date().toISOString().split("T")[0], catatan: "" });
  const [busy, setBusy] = useState(false);

  const loadData = async () => {
    try {
      const data = await base44.entities.Kunjungan.list("-tanggal", 50);
      setList(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await base44.entities.Kunjungan.create({
        karyawan_id: user?.id,
        karyawan_nama: user?.full_name || user?.email,
        ...form,
        status: "direncanakan",
      });
      toast({ title: "Kunjungan dibuat" });
      setOpen(false);
      setForm({ tujuan: "", alamat_kunjungan: "", pic_nama: "", pic_kontak: "", tanggal: new Date().toISOString().split("T")[0], catatan: "" });
      loadData();
    } catch (e) {
      toast({ title: "Gagal membuat kunjungan", variant: "destructive" });
    } finally { setBusy(false); }
  };

  const checkIn = async (item) => {
    await base44.entities.Kunjungan.update(item.id, { check_in: new Date().toISOString(), status: "berlangsung" });
    toast({ title: "Check In kunjungan berhasil" });
    loadData();
  };

  const checkOut = async (item) => {
    await base44.entities.Kunjungan.update(item.id, { check_out: new Date().toISOString(), status: "selesai" });
    toast({ title: "Check Out kunjungan berhasil" });
    loadData();
  };

  if (loading) return <div className="p-8 flex justify-center"><div className="w-8 h-8 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin" /></div>;

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      <PageHeader title="Kunjungan" subtitle="Kelola kunjungan lapangan">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button className="bg-indigo-600 hover:bg-indigo-700"><Plus className="w-4 h-4 mr-1.5" /> Buat Kunjungan</Button></DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Buat Kunjungan Baru</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><Label>Tujuan Kunjungan</Label><Input required value={form.tujuan} onChange={(e) => setForm({ ...form, tujuan: e.target.value })} /></div>
              <div><Label>Alamat</Label><Input value={form.alamat_kunjungan} onChange={(e) => setForm({ ...form, alamat_kunjungan: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>PIC Nama</Label><Input value={form.pic_nama} onChange={(e) => setForm({ ...form, pic_nama: e.target.value })} /></div>
                <div><Label>PIC Kontak</Label><Input value={form.pic_kontak} onChange={(e) => setForm({ ...form, pic_kontak: e.target.value })} /></div>
              </div>
              <div><Label>Tanggal</Label><Input type="date" value={form.tanggal} onChange={(e) => setForm({ ...form, tanggal: e.target.value })} /></div>
              <div><Label>Catatan</Label><Textarea value={form.catatan} onChange={(e) => setForm({ ...form, catatan: e.target.value })} /></div>
              <Button type="submit" disabled={busy} className="w-full bg-indigo-600 hover:bg-indigo-700">Simpan</Button>
            </form>
          </DialogContent>
        </Dialog>
      </PageHeader>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {list.length === 0 && <p className="text-slate-400 col-span-full text-center py-12">Belum ada kunjungan</p>}
        {list.map((k) => (
          <div key={k.id} className="bg-white rounded-2xl border border-slate-200/70 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center"><MapPin className="w-4 h-4 text-indigo-600" /></div>
              <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                k.status === "selesai" ? "bg-emerald-50 text-emerald-700" :
                k.status === "berlangsung" ? "bg-amber-50 text-amber-700" :
                k.status === "dibatalkan" ? "bg-rose-50 text-rose-700" :
                "bg-slate-100 text-slate-600"
              }`}>{k.status}</span>
            </div>
            <h3 className="font-semibold text-slate-900">{k.tujuan}</h3>
            <p className="text-sm text-slate-500 mt-1 line-clamp-2">{k.alamat_kunjungan || "Tanpa alamat"}</p>
            <div className="flex items-center gap-4 mt-4 text-xs text-slate-500">
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> In: {formatTime(k.check_in)}</span>
              <span className="flex items-center gap-1"><LogOut className="w-3 h-3" /> Out: {formatTime(k.check_out)}</span>
            </div>
            <p className="text-xs text-slate-400 mt-2">{k.tanggal} · {k.pic_nama || "-"}</p>
            {!k.check_in && <Button size="sm" className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700" onClick={() => checkIn(k)}><CheckCircle className="w-4 h-4 mr-1" /> Check In</Button>}
            {k.check_in && !k.check_out && <Button size="sm" variant="outline" className="w-full mt-4 border-rose-300 text-rose-600 hover:bg-rose-50" onClick={() => checkOut(k)}><LogOut className="w-4 h-4 mr-1" /> Check Out</Button>}
            {k.check_in && k.check_out && <div className="w-full mt-4 py-2 text-center text-xs text-emerald-600 font-medium">Selesai</div>}
          </div>
        ))}
      </div>
    </div>
  );
}