import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, CalendarClock, Check, X } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export default function IzinCuti() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ jenis: "izin", tanggal_mulai: new Date().toISOString().split("T")[0], tanggal_selesai: new Date().toISOString().split("T")[0], alasan: "" });

  const loadData = async () => {
    try { setList(await base44.entities.IzinCuti.list("-created_date", 50)); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  };
  useEffect(() => { loadData(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    const mulai = new Date(form.tanggal_mulai);
    const selesai = new Date(form.tanggal_selesai);
    const jumlah = Math.max(1, Math.round((selesai - mulai) / 86400000) + 1);
    try {
      await base44.entities.IzinCuti.create({ karyawan_id: user?.id, karyawan_nama: user?.full_name || user?.email, ...form, jumlah_hari: jumlah, status: "pending" });
      toast({ title: "Pengajuan dibuat" });
      setOpen(false); setForm({ jenis: "izin", tanggal_mulai: new Date().toISOString().split("T")[0], tanggal_selesai: new Date().toISOString().split("T")[0], alasan: "" });
      loadData();
    } catch (e) { toast({ title: "Gagal", variant: "destructive" }); }
    finally { setBusy(false); }
  };

  const approve = async (id, status) => {
    await base44.entities.IzinCuti.update(id, { status, disetujui_oleh: user?.full_name || user?.email });
    toast({ title: status === "disetujui" ? "Disetujui" : "Ditolak" });
    loadData();
  };

  if (loading) return <div className="p-8 flex justify-center"><div className="w-8 h-8 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin" /></div>;

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      <PageHeader title="Izin & Cuti" subtitle="Pengajuan dan persetujuan izin">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button className="bg-indigo-600 hover:bg-indigo-700"><Plus className="w-4 h-4 mr-1.5" /> Ajukan</Button></DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Ajukan Izin/Cuti</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div><Label>Jenis</Label>
                <Select value={form.jenis} onValueChange={(v) => setForm({ ...form, jenis: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="izin">Izin</SelectItem><SelectItem value="sakit">Sakit</SelectItem><SelectItem value="cuti_tahunan">Cuti Tahunan</SelectItem><SelectItem value="cuti_besar">Cuti Besar</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Tanggal Mulai</Label><Input type="date" value={form.tanggal_mulai} onChange={(e) => setForm({ ...form, tanggal_mulai: e.target.value })} /></div>
                <div><Label>Tanggal Selesai</Label><Input type="date" value={form.tanggal_selesai} onChange={(e) => setForm({ ...form, tanggal_selesai: e.target.value })} /></div>
              </div>
              <div><Label>Alasan</Label><Textarea required value={form.alasan} onChange={(e) => setForm({ ...form, alasan: e.target.value })} /></div>
              <Button type="submit" disabled={busy} className="w-full bg-indigo-600 hover:bg-indigo-700">Kirim Pengajuan</Button>
            </form>
          </DialogContent>
        </Dialog>
      </PageHeader>

      <div className="grid gap-3">
        {list.length === 0 && <div className="text-center py-16"><CalendarClock className="w-12 h-12 text-slate-300 mx-auto mb-3" /><p className="text-slate-400">Belum ada pengajuan</p></div>}
        {list.map((item) => (
          <div key={item.id} className="bg-white rounded-2xl border border-slate-200/70 p-5 flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0"><CalendarClock className="w-5 h-5 text-indigo-600" /></div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-slate-900">{item.karyawan_nama}</h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">{item.jenis.replace("_", " ")}</span>
              </div>
              <p className="text-sm text-slate-500 mt-0.5">{item.tanggal_mulai} → {item.tanggal_selesai} · {item.jumlah_hari} hari</p>
              <p className="text-xs text-slate-400 mt-1">{item.alasan}</p>
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