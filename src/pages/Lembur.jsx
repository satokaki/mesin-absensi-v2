import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Clock, Check, X } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export default function Lembur() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ tanggal: new Date().toISOString().split("T")[0], jam_mulai: "17:00", jam_selesai: "19:00", alasan: "", tarif_per_jam: 25000 });

  const loadData = async () => {
    try { setList(await base44.entities.Lembur.list("-created_date", 50)); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  };
  useEffect(() => { loadData(); }, []);

  const calcDurasi = (mulai, selesai) => {
    const [h1, m1] = mulai.split(":").map(Number);
    const [h2, m2] = selesai.split(":").map(Number);
    let mins = (h2 * 60 + m2) - (h1 * 60 + m1);
    if (mins < 0) mins += 24 * 60;
    return mins / 60;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    const durasi = calcDurasi(form.jam_mulai, form.jam_selesai);
    const total = durasi * Number(form.tarif_per_jam);
    try {
      await base44.entities.Lembur.create({ karyawan_id: user?.id, karyawan_nama: user?.full_name || user?.email, ...form, tarif_per_jam: Number(form.tarif_per_jam), durasi_jam: durasi, total_upah: total, status: "pending" });
      toast({ title: "Lembur diajukan" });
      setOpen(false); setForm({ tanggal: new Date().toISOString().split("T")[0], jam_mulai: "17:00", jam_selesai: "19:00", alasan: "", tarif_per_jam: 25000 });
      loadData();
    } catch (e) { toast({ title: "Gagal", variant: "destructive" }); }
    finally { setBusy(false); }
  };

  const approve = async (id, status) => {
    await base44.entities.Lembur.update(id, { status, disetujui_oleh: user?.full_name || user?.email });
    toast({ title: status === "disetujui" ? "Disetujui" : "Ditolak" });
    loadData();
  };

  if (loading) return <div className="p-8 flex justify-center"><div className="w-8 h-8 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin" /></div>;

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      <PageHeader title="Lembur" subtitle="Pengajuan dan persetujuan lembur">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button className="bg-indigo-600 hover:bg-indigo-700"><Plus className="w-4 h-4 mr-1.5" /> Ajukan Lembur</Button></DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Ajukan Lembur</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div><Label>Tanggal</Label><Input type="date" value={form.tanggal} onChange={(e) => setForm({ ...form, tanggal: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Jam Mulai</Label><Input type="time" value={form.jam_mulai} onChange={(e) => setForm({ ...form, jam_mulai: e.target.value })} /></div>
                <div><Label>Jam Selesai</Label><Input type="time" value={form.jam_selesai} onChange={(e) => setForm({ ...form, jam_selesai: e.target.value })} /></div>
              </div>
              <div><Label>Tarif per Jam (Rp)</Label><Input type="number" value={form.tarif_per_jam} onChange={(e) => setForm({ ...form, tarif_per_jam: e.target.value })} /></div>
              <div><Label>Alasan</Label><Textarea required value={form.alasan} onChange={(e) => setForm({ ...form, alasan: e.target.value })} /></div>
              <Button type="submit" disabled={busy} className="w-full bg-indigo-600 hover:bg-indigo-700">Kirim</Button>
            </form>
          </DialogContent>
        </Dialog>
      </PageHeader>

      <div className="grid gap-3">
        {list.length === 0 && <div className="text-center py-16"><Clock className="w-12 h-12 text-slate-300 mx-auto mb-3" /><p className="text-slate-400">Belum ada pengajuan lembur</p></div>}
        {list.map((item) => (
          <div key={item.id} className="bg-white rounded-2xl border border-slate-200/70 p-5 flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-amber-50 flex items-center justify-center shrink-0"><Clock className="w-5 h-5 text-amber-600" /></div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-slate-900">{item.karyawan_nama}</h3>
              <p className="text-sm text-slate-500 mt-0.5">{item.tanggal} · {item.jam_mulai} - {item.jam_selesai} · {item.durasi_jam}j</p>
              <p className="text-xs text-slate-400 mt-1">{item.alasan}</p>
            </div>
            <div className="text-right">
              <p className="font-semibold text-slate-900">Rp {item.total_upah?.toLocaleString("id-ID")}</p>
            </div>
            <div className="flex items-center gap-2">
              {item.status === "pending" ? (
                <>
                  <Button size="sm" variant="outline" className="border-emerald-300 text-emerald-600 hover:bg-emerald-50" onClick={() => approve(item.id, "disetujui")}><Check className="w-4 h-4" /></Button>
                  <Button size="sm" variant="outline" className="border-rose-300 text-rose-600 hover:bg-rose-50" onClick={() => approve(item.id, "ditolak")}><X className="w-4 h-4" /></Button>
                </>
              ) : (
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${item.status === "disetujui" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>{item.status}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}