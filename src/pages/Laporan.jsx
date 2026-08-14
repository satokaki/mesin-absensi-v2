import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { FileBarChart, Download, Fingerprint, MapPin, Landmark, CalendarClock, Clock } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useCompany } from "@/lib/CompanyContext";
import { companyFilter, companyPayload } from "@/lib/tenant";
import { generateBusinessCode } from "@/lib/codeGenerator";

export default function Laporan() {
  const { toast } = useToast();
  const { activeCompany } = useCompany();
  const [type, setType] = useState("absensi");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const entityMap = { absensi: "Absensi", kunjungan: "Kunjungan", pinjaman: "Pinjaman", izincuti: "IzinCuti", lembur: "Lembur" };
  const iconMap = { absensi: Fingerprint, kunjungan: MapPin, pinjaman: Landmark, izincuti: CalendarClock, lembur: Clock };

  const loadData = async () => {
    setLoading(true);
    try { setData(activeCompany?.id ? await base44.entities[entityMap[type]].filter(companyFilter(activeCompany), "-created_date", 100) : []); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, [type, activeCompany?.id]);

  const exportCSV = async () => {
    if (!data.length) return;
    const reportCode = generateBusinessCode("laporan", activeCompany);
    const headers = Object.keys(data[0]).filter((k) => !k.startsWith("_"));
    const rows = data.map((r) => headers.map((h) => `"${String(r[h] ?? "").replace(/"/g, '""')}"`).join(","));
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${reportCode}-${type}.csv`; a.click();
    await base44.entities.LaporanExport.create(companyPayload(activeCompany, { kode_laporan: reportCode, jenis: type, dibuat_pada: new Date().toISOString(), jumlah_data: data.length }));
    toast({ title: "CSV diunduh", description: `Kode laporan: ${reportCode}` });
  };

  const Icon = iconMap[type];
  const cols = data.length ? Object.keys(data[0]).filter((k) => !k.startsWith("_") && k !== "id").slice(0, 6) : [];

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      <PageHeader title="Laporan" subtitle="Rekap data dan ekspor laporan">
        <Button variant="outline" onClick={exportCSV} disabled={!data.length}><Download className="w-4 h-4 mr-1.5" /> Export CSV</Button>
      </PageHeader>

      <div className="flex gap-2 mb-6 flex-wrap">
        {Object.entries(entityMap).map(([key, label]) => {
          const I = iconMap[key];
          return (
            <button key={key} onClick={() => setType(key)} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-all ${type === key ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-slate-600 border-slate-200 hover:border-indigo-300"}`}>
              <I className="w-4 h-4" /> {label}
            </button>
          );
        })}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/70 overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center"><div className="w-8 h-8 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin" /></div>
        ) : data.length === 0 ? (
          <div className="p-16 text-center"><FileBarChart className="w-12 h-12 text-slate-300 mx-auto mb-3" /><p className="text-slate-400">Tidak ada data</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr className="text-left text-slate-500">{cols.map((c) => <th key={c} className="px-4 py-3 font-medium capitalize">{c.replace(/_/g, " ")}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/50">
                    {cols.map((c) => <td key={c} className="px-4 py-3 text-slate-700 max-w-[200px] truncate">{String(row[c] ?? "-")}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
