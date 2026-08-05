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
import { Plus, Megaphone, Trash2, AlertCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export default function Pengumuman() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ judul: "", isi: "", kategori: "umum", target: "semua", status: "aktif" });

  const loadData = async () => {
    try { setList(await base44.entities.Pengumuman.list("-created_date", 50)); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  };
  useEffect(() => { loadData(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await base44.entities.Pengumuman.create({ ...form, dibuat_oleh: user?.full_name || user?.email, tanggal_mulai: new Date().toISOString().split("T")[0] });
      toast({ title: "Pengumuman dibuat" });
      setOpen(false); setForm({ judul: "", isi: "", kategori: "umum", target: "semua", status: "aktif" });
      loadData();
    } catch (e) { toast({ title: "Gagal", variant: "destructive" }); }
    finally { setBusy(false); }
  };

  const handleDelete = async (id) => {
    await base44.entities.Pengumuman.delete(id);
    toast({ title: "Dihapus" });
    loadData();
  };

  if (loading) return <div className="p-8 flex justify-center"><div className="w-8 h-8 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin" /></div>;

  const catColor = { umum: "bg-indigo-50 text-indigo-700", urgent: "bg-rose-50 text-rose-700", event: "bg-amber-50 text-amber-700", kebijakan: "bg-sky-50 text-sky-700" };

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      <PageHeader title="Pengumuman" subtitle="Broadcast informasi ke karyawan">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button className="bg-indigo-600 hover:bg-indigo-700"><Plus className="w-4 h-4 mr-1.5" /> Buat Pengumuman</Button></DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Buat Pengumuman</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div><Label>Judul</Label><Input required value={form.judul} onChange={(e) => setForm({ ...form, judul: e.target.value })} /></div>
              <div><Label>Isi</Label><Textarea required rows={4} value={form.isi} onChange={(e) => setForm({ ...form, isi: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Kategori</Label>
                  <Select value={form.kategori} onValueChange={(v) => setForm({ ...form, kategori: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="umum">Umum</SelectItem><SelectItem value="urgent">Urgent</SelectItem><SelectItem value="event">Event</SelectItem><SelectItem value="kebijakan">Kebijakan</SelectItem></SelectContent>
                  </Select>
                </div>
                <div><Label>Target</Label>
                  <Select value={form.target} onValueChange={(v) => setForm({ ...form, target: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="semua">Semua</SelectItem><SelectItem value="cabang">Cabang</SelectItem><SelectItem value="departemen">Departemen</SelectItem></SelectContent>
                  </Select>
                </div>
              </div>
              <Button type="submit" disabled={busy} className="w-full bg-indigo-600 hover:bg-indigo-700">Publikasi</Button>
            </form>
          </DialogContent>
        </Dialog>
      </PageHeader>

      <div className="grid gap-4">
        {list.length === 0 && <div className="text-center py-16"><Megaphone className="w-12 h-12 text-slate-300 mx-auto mb-3" /><p className="text-slate-400">Belum ada pengumuman</p></div>}
        {list.map((p) => (
          <div key={p.id} className="bg-white rounded-2xl border border-slate-200/70 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between gap-4">
              <div className="flex gap-3 flex-1 min-w-0">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${p.kategori === "urgent" ? "bg-rose-50" : "bg-indigo-50"}`}>
                  {p.kategori === "urgent" ? <AlertCircle className="w-5 h-5 text-rose-600" /> : <Megaphone className="w-5 h-5 text-indigo-600" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-slate-900">{p.judul}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${catColor[p.kategori] || catColor.umum}`}>{p.kategori}</span>
                  </div>
                  <p className="text-sm text-slate-600 mt-2 leading-relaxed">{p.isi}</p>
                  <p className="text-xs text-slate-400 mt-3">Oleh: {p.dibuat_oleh || "-"} · Target: {p.target}</p>
                </div>
              </div>
              <button onClick={() => handleDelete(p.id)} className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-500 shrink-0"><Trash2 className="w-4 h-4" /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}