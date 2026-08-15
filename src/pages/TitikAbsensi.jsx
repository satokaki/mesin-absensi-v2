import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Pencil, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useCompany } from "@/lib/CompanyContext";
import { assertCompanyOwnership, companyFilter, companyPayload } from "@/lib/tenant";
import { withGeneratedCode } from "@/lib/codeGenerator";

const emptyForm = { kode: "", nama: "", cabang_id: "", alamat: "", latitude: "", longitude: "", radius_meter: 100, status: "aktif" };

export default function TitikAbsensi() {
  const { activeCompany } = useCompany();
  const { toast } = useToast();
  const [items, setItems] = useState([]);
  const [branches, setBranches] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const loadData = async () => {
    if (!activeCompany?.id) return setItems([]);
    const [locations, branchList] = await Promise.all([
      base44.entities.TitikAbsensi.filter(companyFilter(activeCompany), "nama"),
      base44.entities.Cabang.filter(companyFilter(activeCompany), "nama"),
    ]);
    setItems(locations); setBranches(branchList);
  };
  useEffect(() => { loadData(); }, [activeCompany?.id]);

  const save = async (event) => {
    event.preventDefault(); setBusy(true);
    try {
      const branch = branches.find((item) => item.id === form.cabang_id);
      const isCompanyLocation = !form.cabang_id;
      const raw = companyPayload(activeCompany, { ...form, cabang_id: branch?.id || "", cabang_nama: branch?.nama || "", is_company_location: isCompanyLocation, latitude: Number(form.latitude), longitude: Number(form.longitude), radius_meter: Number(form.radius_meter) });
      if (editId) {
        assertCompanyOwnership(activeCompany, form);
        await base44.entities.TitikAbsensi.update(editId, raw);
      } else if (isCompanyLocation) {
        const existing = items.find((item) => item.is_company_location);
        if (existing) await base44.entities.TitikAbsensi.update(existing.id, raw);
        else await base44.entities.TitikAbsensi.create(withGeneratedCode("titik_absensi", "kode", activeCompany, raw));
      } else {
        await base44.entities.TitikAbsensi.create(withGeneratedCode("titik_absensi", "kode", activeCompany, raw));
      }
      toast({ title: editId ? "Titik absensi diperbarui" : "Titik absensi ditambahkan" });
      setOpen(false); setForm(emptyForm); setEditId(null); await loadData();
    } catch (error) { toast({ title: "Gagal menyimpan titik absensi", description: error.message, variant: "destructive" }); }
    finally { setBusy(false); }
  };

  const remove = async (item) => {
    assertCompanyOwnership(activeCompany, item);
    await base44.entities.TitikAbsensi.delete(item.id);
    toast({ title: "Titik absensi dihapus" }); await loadData();
  };

  return <div className="p-6 lg:p-8 max-w-6xl mx-auto">
    <PageHeader title="Titik Absensi" subtitle="Lokasi GPS absensi terpisah untuk setiap perusahaan dan cabang">
      <Button onClick={() => { setEditId(null); setForm(emptyForm); setOpen(true); }}><Plus className="w-4 h-4 mr-2" />Tambah Lokasi</Button>
    </PageHeader>
    <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
      {items.map((item) => <div key={item.id} className="bg-white border rounded-2xl p-5">
        <div className="flex justify-between"><MapPin className="text-indigo-600" /><span className="text-xs font-mono text-slate-500">{item.kode}</span></div>
        <h3 className="font-semibold mt-3">{item.nama}</h3><p className="text-sm text-slate-500">{item.cabang_nama || "Semua cabang"}</p>
        <p className="text-xs text-slate-400 mt-2">Radius {item.radius_meter} m · {item.status}</p>
        <div className="flex gap-2 mt-4"><Button size="sm" variant="outline" onClick={() => { setEditId(item.id); setForm(item); setOpen(true); }}><Pencil className="w-3 h-3" /></Button><Button size="sm" variant="outline" onClick={() => remove(item)}><Trash2 className="w-3 h-3 text-rose-500" /></Button></div>
      </div>)}
      {!items.length && <p className="text-slate-400 col-span-full text-center py-16">Belum ada titik absensi untuk perusahaan ini.</p>}
    </div>
    <Dialog open={open} onOpenChange={setOpen}><DialogContent><DialogHeader><DialogTitle>{editId ? "Edit" : "Tambah"} Titik Absensi</DialogTitle></DialogHeader>
      <form onSubmit={save} className="space-y-3">
        <div><Label>Perusahaan</Label><Input readOnly className="bg-slate-50" value={activeCompany?.nama || "Belum ada perusahaan aktif"} /></div>
        <div><Label>Kode</Label><Input readOnly className="bg-slate-50" value={editId ? form.kode || "Akan dibuat otomatis" : "Otomatis saat disimpan"} /></div>
        <div><Label>Nama</Label><Input required value={form.nama || ""} onChange={(e) => setForm({ ...form, nama: e.target.value })} /></div>
        <div><Label>Cabang (Opsional)</Label><Select value={form.cabang_id || "__company__"} onValueChange={(value) => setForm({ ...form, cabang_id: value === "__company__" ? "" : value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="__company__">Lokasi Utama Perusahaan</SelectItem>{branches.map((branch) => <SelectItem key={branch.id} value={branch.id}>{branch.nama}</SelectItem>)}</SelectContent></Select></div>
        <div><Label>Alamat</Label><Input value={form.alamat || ""} onChange={(e) => setForm({ ...form, alamat: e.target.value })} /></div>
        <div className="grid grid-cols-2 gap-3"><div><Label>Latitude</Label><Input required type="number" step="any" value={form.latitude ?? ""} onChange={(e) => setForm({ ...form, latitude: e.target.value })} /></div><div><Label>Longitude</Label><Input required type="number" step="any" value={form.longitude ?? ""} onChange={(e) => setForm({ ...form, longitude: e.target.value })} /></div></div>
        <div className="grid grid-cols-2 gap-3"><div><Label>Radius (meter)</Label><Input required min="1" type="number" value={form.radius_meter ?? 100} onChange={(e) => setForm({ ...form, radius_meter: e.target.value })} /></div><div><Label>Status</Label><Select value={form.status || "aktif"} onValueChange={(value) => setForm({ ...form, status: value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="aktif">Aktif</SelectItem><SelectItem value="nonaktif">Nonaktif</SelectItem></SelectContent></Select></div></div>
        <Button className="w-full" disabled={busy}>Simpan</Button>
      </form>
    </DialogContent></Dialog>
  </div>;
}
