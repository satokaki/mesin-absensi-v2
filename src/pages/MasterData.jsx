import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Building2, Layers, Briefcase, Clock3, Pencil, Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useCompany } from "@/lib/CompanyContext";
import { assertCompanyOwnership, companyFilter, companyPayload } from "@/lib/tenant";
import { withGeneratedCode } from "@/lib/codeGenerator";

const TABS = [
  { key: "cabang", label: "Cabang", entity: "Cabang", icon: Building2 },
  { key: "departemen", label: "Departemen", entity: "Departemen", icon: Layers },
  { key: "jabatan", label: "Jabatan", entity: "Jabatan", icon: Briefcase },
  { key: "shift", label: "Shift", entity: "Shift", icon: Clock3 },
];

export default function MasterData() {
  const { toast } = useToast();
  const { activeCompany } = useCompany();
  const [tab, setTab] = useState("cabang");
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({});
  const [busy, setBusy] = useState(false);

  const loadAll = async () => {
    if (!activeCompany?.id) {
      setData({});
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const entries = await Promise.all(
        TABS.map((t) => base44.entities[t.entity].filter(companyFilter(activeCompany)))
      );
      const map = {};
      TABS.forEach((t, i) => { map[t.key] = entries[i]; });
      setData(map);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadAll(); }, [activeCompany?.id]);

  const activeTab = TABS.find((t) => t.key === tab);
  const items = data[tab] || [];

  const openCreate = () => { setEditId(null); setForm({}); setOpen(true); };
  const openEdit = (item) => { setEditId(item.id); setForm(item); setOpen(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (editId) {
        assertCompanyOwnership(activeCompany, form);
        await base44.entities[activeTab.entity].update(editId, companyPayload(activeCompany, form));
        toast({ title: "Diperbarui" });
      } else {
        const payload = companyPayload(activeCompany, form);
        await base44.entities[activeTab.entity].create(
          withGeneratedCode(activeTab.key, "kode", activeCompany, payload)
        );
        toast({ title: "Ditambahkan" });
      }
      setOpen(false);
      loadAll();
    } catch (e) {
      toast({ title: "Gagal", variant: "destructive" });
    } finally { setBusy(false); }
  };

  const handleDelete = async (id) => {
    const record = items.find((item) => item.id === id);
    assertCompanyOwnership(activeCompany, record);
    await base44.entities[activeTab.entity].delete(id);
    toast({ title: "Dihapus" });
    loadAll();
  };

  const fields = {
    cabang: [["kode", "Kode"], ["nama", "Nama"], ["alamat", "Alamat"], ["telepon", "Telepon"], ["kota", "Kota"]],
    departemen: [["kode", "Kode"], ["nama", "Nama"]],
    jabatan: [["kode", "Kode"], ["nama", "Nama"], ["level", "Level"]],
    shift: [["kode", "Kode"], ["nama", "Nama"], ["jam_masuk", "Jam Masuk"], ["jam_keluar", "Jam Keluar"]],
  };

  if (loading) return <div className="p-8 flex justify-center"><div className="w-8 h-8 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin" /></div>;

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      <PageHeader title="Master Data" subtitle="Kelola data referensi perusahaan">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button onClick={openCreate} className="bg-indigo-600 hover:bg-indigo-700"><Plus className="w-4 h-4 mr-1.5" /> Tambah</Button></DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>{editId ? "Edit" : "Tambah"} {activeTab.label}</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-3">
              {fields[tab].map(([key, label]) => (
                <div key={key}>
                  <Label>{label}</Label>
                  <Input required={key === "nama"} placeholder={key === "kode" ? "Otomatis jika kosong" : undefined} value={form[key] || ""} onChange={(e) => setForm({ ...form, [key]: e.target.value })} />
                </div>
              ))}
              <Button type="submit" disabled={busy} className="w-full bg-indigo-600 hover:bg-indigo-700">Simpan</Button>
            </form>
          </DialogContent>
        </Dialog>
      </PageHeader>

      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit mb-6 overflow-x-auto">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${tab === t.key ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
            <t.icon className="w-4 h-4" /> {t.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/70 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr className="text-left text-slate-500">
              {fields[tab].map(([key, label]) => <th key={key} className="px-5 py-3 font-medium">{label}</th>)}
              <th className="px-5 py-3 font-medium text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.length === 0 && <tr><td colSpan={fields[tab].length + 1} className="px-5 py-12 text-center text-slate-400">Belum ada data</td></tr>}
            {items.map((item) => (
              <tr key={item.id} className="hover:bg-slate-50/50">
                {fields[tab].map(([key]) => <td key={key} className="px-5 py-3 text-slate-700">{item[key] || "-"}</td>)}
                <td className="px-5 py-3 text-right">
                  <div className="flex justify-end gap-1">
                    <button onClick={() => openEdit(item)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(item.id)} className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-500"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
