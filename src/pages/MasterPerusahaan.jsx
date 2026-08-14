import React, { useEffect, useState } from "react";
import { Building2, Pencil, Plus } from "lucide-react";
import { base44 } from "@/api/base44Client";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { useCompany } from "@/lib/CompanyContext";

const emptyForm = {
  kode: "", nama: "", nama_legal: "", alamat: "", kota: "", provinsi: "",
  telepon: "", email: "", npwp: "", mata_uang: "IDR", zona_waktu: "Asia/Jakarta", status: "aktif",
};

export default function MasterPerusahaan() {
  const { toast } = useToast();
  const { activeCompany, isSuperAdmin, reloadCompanies } = useCompany();
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [busy, setBusy] = useState(false);

  const loadCompanies = async () => {
    setLoading(true);
    try {
      const rows = isSuperAdmin
        ? await base44.entities.Perusahaan.list("nama")
        : activeCompany ? [activeCompany] : [];
      setCompanies(rows);
    } catch (error) {
      console.error(error);
      toast({ title: "Gagal memuat perusahaan", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadCompanies(); }, [activeCompany?.id, isSuperAdmin]);

  const openCreate = () => {
    setEditId(null);
    setForm(emptyForm);
    setOpen(true);
  };

  const openEdit = (company) => {
    if (!isSuperAdmin && company.id !== activeCompany?.id) return;
    setEditId(company.id);
    setForm({ ...emptyForm, ...company });
    setOpen(true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setBusy(true);
    try {
      if (editId) {
        if (!isSuperAdmin && editId !== activeCompany?.id) throw new Error("Akses ditolak");
        await base44.entities.Perusahaan.update(editId, form);
        toast({ title: "Profil perusahaan diperbarui" });
      } else {
        if (!isSuperAdmin) throw new Error("Hanya Super Admin yang dapat menambah perusahaan");
        await base44.entities.Perusahaan.create(form);
        toast({ title: "Perusahaan ditambahkan" });
      }
      setOpen(false);
      await reloadCompanies();
      await loadCompanies();
    } catch (error) {
      toast({ title: "Gagal menyimpan", description: error?.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const fields = [
    ["kode", "Kode"], ["nama", "Nama Perusahaan"], ["nama_legal", "Nama Legal"],
    ["alamat", "Alamat"], ["kota", "Kota"], ["provinsi", "Provinsi"],
    ["telepon", "Telepon"], ["email", "Email"], ["npwp", "NPWP"],
  ];

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      <PageHeader title="Master Perusahaan" subtitle="Kelola tenant, identitas, dan status perusahaan">
        {isSuperAdmin && <Button onClick={openCreate}><Plus className="w-4 h-4 mr-2" />Tambah Perusahaan</Button>}
      </PageHeader>

      <div className="bg-white rounded-2xl border border-slate-200/70 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-sm text-slate-400">Memuat perusahaan...</div>
        ) : companies.length === 0 ? (
          <div className="p-12 text-center">
            <Building2 className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-slate-500 mt-3">Belum ada perusahaan yang dapat diakses.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-slate-500">
                <tr><th className="px-5 py-3">Kode</th><th className="px-5 py-3">Perusahaan</th><th className="px-5 py-3">Lokasi</th><th className="px-5 py-3">Status</th><th className="px-5 py-3 text-right">Aksi</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {companies.map((company) => (
                  <tr key={company.id}>
                    <td className="px-5 py-4 font-medium">{company.kode}</td>
                    <td className="px-5 py-4"><p className="font-medium text-slate-900">{company.nama}</p><p className="text-xs text-slate-400">{company.nama_legal}</p></td>
                    <td className="px-5 py-4 text-slate-600">{[company.kota, company.provinsi].filter(Boolean).join(", ") || "-"}</td>
                    <td className="px-5 py-4"><span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs text-emerald-700">{company.status}</span></td>
                    <td className="px-5 py-4 text-right"><button onClick={() => openEdit(company)} className="p-2 text-slate-500 hover:text-indigo-600"><Pencil className="w-4 h-4" /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editId ? "Edit" : "Tambah"} Perusahaan</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="grid sm:grid-cols-2 gap-4">
            {fields.map(([key, label]) => (
              <div key={key} className={key === "alamat" ? "sm:col-span-2" : ""}>
                <Label>{label}</Label>
                <Input type={key === "email" ? "email" : "text"} required={key === "kode" || key === "nama"} value={form[key] || ""} onChange={(event) => setForm({ ...form, [key]: event.target.value })} />
              </div>
            ))}
            <div><Label>Status</Label><select className="w-full h-10 rounded-md border border-input px-3" value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}><option value="aktif">Aktif</option><option value="nonaktif">Nonaktif</option></select></div>
            <div className="sm:col-span-2"><Button type="submit" disabled={busy} className="w-full">{busy ? "Menyimpan..." : "Simpan Perusahaan"}</Button></div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
