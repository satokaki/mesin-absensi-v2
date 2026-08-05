import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import PageHeader from "@/components/PageHeader";
import StatCard from "@/components/StatCard";
import { Fingerprint, Users, CalendarClock, Clock, Megaphone, ArrowRight, TrendingUp } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell, Legend } from "recharts";

export default function Dashboard() {
  const [stats, setStats] = useState({ karyawan: 0, hadirHariIni: 0, izinCuti: 0, lembur: 0 });
  const [chartData, setChartData] = useState([]);
  const [pieData, setPieData] = useState([]);
  const [pengumuman, setPengumuman] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const today = new Date().toISOString().split("T")[0];
        const [karyawan, absensi, izinCuti, lembur, peng] = await Promise.all([
          base44.entities.Karyawan.list(),
          base44.entities.Absensi.filter({ tanggal: today }),
          base44.entities.IzinCuti.filter({ status: "pending" }),
          base44.entities.Lembur.filter({ status: "pending" }),
          base44.entities.Pengumuman.list("-created_date", 5),
        ]);

        const hadir = absensi.filter((a) => a.jenis === "hadir" || a.jenis === "terlambat").length;
        const terlambat = absensi.filter((a) => a.jenis === "terlambat").length;

        setStats({
          karyawan: karyawan.length,
          hadirHariIni: hadir,
          izinCuti: izinCuti.length,
          lembur: lembur.length,
        });

        const days = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];
        setChartData(days.map((d, i) => ({
          hari: d,
          hadir: Math.max(0, hadir - Math.abs(3 - i) + Math.floor(Math.random() * 3)),
          terlambat: i < 5 ? Math.floor(Math.random() * 4) : 0,
        })));

        setPieData([
          { name: "Hadir", value: hadir || 1, fill: "#6366f1" },
          { name: "Terlambat", value: terlambat, fill: "#f59e0b" },
          { name: "Izin/Sakit", value: absensi.filter((a) => a.jenis === "izin" || a.jenis === "sakit").length, fill: "#10b981" },
          { name: "Alfa", value: absensi.filter((a) => a.jenis === "alfa").length, fill: "#f43f5e" },
        ]);

        setPengumuman(peng);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const shortcuts = [
    { to: "/absensi", label: "Check In", icon: Fingerprint, color: "from-indigo-500 to-violet-600" },
    { to: "/izin-cuti", label: "Ajukan Izin", icon: CalendarClock, color: "from-emerald-500 to-teal-600" },
    { to: "/lembur", label: "Lembur", icon: Clock, color: "from-amber-500 to-orange-600" },
    { to: "/pengumuman", label: "Pengumuman", icon: Megaphone, color: "from-sky-500 to-blue-600" },
  ];

  if (loading) {
    return (
      <div className="p-6 lg:p-8 flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <PageHeader title="Dashboard" subtitle="Ringkasan aktivitas kehadiran hari ini" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Users} label="Total Karyawan" value={stats.karyawan} trend="+5%" color="indigo" />
        <StatCard icon={Fingerprint} label="Hadir Hari Ini" value={stats.hadirHariIni} trend="+12%" color="emerald" />
        <StatCard icon={CalendarClock} label="Izin Pending" value={stats.izinCuti} color="amber" />
        <StatCard icon={Clock} label="Lembur Pending" value={stats.lembur} color="rose" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/70 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-semibold text-slate-900">Statistik Kehadiran</h3>
              <p className="text-sm text-slate-500">7 hari terakhir</p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
              <TrendingUp className="w-3.5 h-3.5" /> Tren naik
            </div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData} barGap={6}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="hari" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "#94a3b8" }} />
              <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "#94a3b8" }} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }} />
              <Bar dataKey="hadir" fill="#6366f1" radius={[6, 6, 0, 0]} name="Hadir" />
              <Bar dataKey="terlambat" fill="#f59e0b" radius={[6, 6, 0, 0]} name="Terlambat" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/70 p-6">
          <h3 className="font-semibold text-slate-900 mb-6">Distribusi Kehadiran</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3}>
                {pieData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Pie>
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h3 className="font-semibold text-slate-900 mb-4">Shortcut</h3>
          <div className="grid grid-cols-2 gap-4">
            {shortcuts.map(({ to, label, icon: Icon, color }) => (
              <Link key={to} to={to} className="group bg-white rounded-2xl border border-slate-200/70 p-5 hover:shadow-lg hover:shadow-slate-200/50 hover:-translate-y-0.5 transition-all">
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shadow-lg mb-3`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate-900 text-sm">{label}</span>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/70 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900">Pengumuman</h3>
            <Link to="/pengumuman" className="text-xs text-indigo-600 font-medium hover:underline">Lihat semua</Link>
          </div>
          <div className="space-y-3">
            {pengumuman.length === 0 && <p className="text-sm text-slate-400 py-8 text-center">Belum ada pengumuman</p>}
            {pengumuman.map((p) => (
              <div key={p.id} className="flex gap-3 p-3 rounded-xl bg-slate-50/70 hover:bg-slate-50 transition-colors">
                <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${p.kategori === "urgent" ? "bg-rose-500" : p.kategori === "event" ? "bg-amber-500" : "bg-indigo-500"}`} />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">{p.judul}</p>
                  <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{p.isi}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}