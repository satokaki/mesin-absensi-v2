import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Landmark, Check, X } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useCompany } from "@/lib/CompanyContext";
import { companyFilter, companyPayload } from "@/lib/tenant";
import { withGeneratedCode } from "@/lib/codeGenerator";

export default function Pinjaman() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { activeCompany } = useCompany();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ jenis_pinjaman: "Pinjaman Karyawan", jumlah_pinjaman: 5000000, tenor_bulan: 12, bunga_persen: 0, alasan: "" });

  const loadData = async () => {
    try { setList(activeCompany?.id ? await base44.entities.Pinjaman.filter(companyFilter(activeCompany), "-created_date", 50) : []); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  };
  useEffect(() => { loadData(); }, [activeCompany?.id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    const pokok = Number(form.jumlah_pinjaman);
    const tenor = Number(form.tenor_bulan);
    const bunga = Number(form.bunga_persen);
    const totalBunga = pokok * (bunga / 100);
    const cicilan = Math.round((pokok + totalBunga) / tenor);
    try {
      await base44.entities.Pinjaman.create(withGeneratedCode("pinjaman", "kode_pinjaman", activeCompany, companyPayload(activeCompany, {
        karyawan_id: user?.id, karyawan_nama: user?.full_name || user?.email,
        ...form, jumlah_pinjaman: pokok, tenor_bulan: tenor, bunga_persen: bunga,
        cicilan_per_bulan: cicilan, sisa_pokok: pokok,
        tanggal_pengajuan: new Date().toISOString().split("T")[0], status: "pending",
      })));
      toast({ title: "Pinjaman diajukan" });
      setOpen(false); setForm({ jenis_pinjaman: "Pinjaman Karyawan", jumlah_pinjaman: 5000000, tenor_bulan: 12, bunga_persen: 0, alasan: "" });
      loadData();
    } catch (e) { toast({ title: "Gagal", variant: "destructive" }); }
    finally { setBusy(false); }
  };

  const approve = async (id, status) => {
    await base44.entities.Pinjaman.update(id, { status: status === "disetujui" ? "disetujui" : "ditolak", disetujui_oleh: user?.full_name || user?.email, tanggal_disetujui: status === "disetujui" ? new Date().toISOString().split("T")[0] : undefined });
    toast({ title: status === "disetujui" ? "Disetujui" : "Ditolak" });
    loadData();
  };

  if (loading) return <div className="p-8 flex justify-center"><div className="w-8 h-8 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin" /></div>;

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      <PageHeader title="Pinjaman Karyawan" subtitle="Pengajuan dan cicilan pinjaman">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button className="bg-indigo-600 hover:bg-indigo-700"><Plus className="w-4 h-4 mr-1.5" /> Ajukan Pinjaman</Button></DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Ajukan Pinjaman</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div><Label>Jenis Pinjaman</Label><Input value={form.jenis_pinjaman} onChange={(e) => setForm({ ...form, jenis_pinjaman: e.target.value })} /></div>
              <div><Label>Jumlah Pinjaman (Rp)</Label><Input type="number" value={form.jumlah_pinjaman} onChange={(e) => setForm({ ...form, jumlah_pinjaman: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Tenor (bulan)</Label><Input type="number" value={form.tenor_bulan} onChange={(e) => setForm({ ...form, tenor_bulan: e.target.value })} /></div>
                <div><Label>Bunga (%)</Label><Input type="number" value={form.bunga_persen} onChange={(e) => setForm({ ...form, bunga_persen: e.target.value })} /></div>
              </div>
              <div><Label>Alasan</Label><Textarea required value={form.alasan} onChange={(e) => setForm({ ...form, alasan: e.target.value })} /></div>
              <Button type="submit" disabled={busy} className="w-full bg-indigo-600 hover:bg-indigo-700">Kirim</Button>
            </form>
          </DialogContent>
        </Dialog>
      </PageHeader>

      <div className="grid gap-3">
        {list.length === 0 && <div className="text-center py-16"><Landmark className="w-12 h-12 text-slate-300 mx-auto mb-3" /><p className="text-slate-400">Belum ada pinjaman</p></div>}
        {list.map((item) => (
          <div key={item.id} className="bg-white rounded-2xl border border-slate-200/70 p-5 flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-violet-50 flex items-center justify-center shrink-0"><Landmark className="w-5 h-5 text-violet-600" /></div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-slate-900">{item.karyawan_nama}</h3>
              <p className="text-sm text-slate-500 mt-0.5">{item.jenis_pinjaman} · {item.tenor_bulan} bulan</p>
            </div>
            <div className="text-right">
              <p className="font-semibold text-slate-900">Rp {item.jumlah_pinjaman?.toLocaleString("id-ID")}</p>
              <p className="text-xs text-slate-400">Cicilan: Rp {item.cicilan_per_bulan?.toLocaleString("id-ID")}/bln</p>
            </div>
            <div className="flex items-center gap-2">
              {item.status === "pending" ? (
                <>
                  <Button size="sm" variant="outline" className="border-emerald-300 text-emerald-600 hover:bg-emerald-50" onClick={() => approve(item.id, "disetujui")}><Check className="w-4 h-4" /></Button>
                  <Button size="sm" variant="outline" className="border-rose-300 text-rose-600 hover:bg-rose-50" onClick={() => approve(item.id, "ditolak")}><X className="w-4 h-4" /></Button>
                </>
              ) : (
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${item.status === "disetujui" || item.status === "aktif" ? "bg-emerald-50 text-emerald-700" : item.status === "lunas" ? "bg-sky-50 text-sky-700" : "bg-rose-50 text-rose-700"}`}>{item.status}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
