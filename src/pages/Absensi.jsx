import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Fingerprint, LogOut, Clock, MapPin, Camera, Calendar } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

function formatTime(iso) {
  if (!iso) return "--:--";
  return new Date(iso).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
}

function calcDuration(inTime, outTime) {
  if (!inTime || !outTime) return null;
  const diff = new Date(outTime) - new Date(inTime);
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  return `${h}j ${m}m`;
}

export default function Absensi() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [today, setToday] = useState(null);
  const [riwayat, setRiwayat] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState("absensi");

  const todayStr = new Date().toISOString().split("T")[0];
  const now = new Date();
  const currentTime = now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });

  const loadData = async () => {
    try {
      const [todayList, history] = await Promise.all([
        base44.entities.Absensi.filter({ tanggal: todayStr }),
        base44.entities.Absensi.list("-tanggal", 30),
      ]);
      const mine = todayList.find((a) => a.karyawan_id === user?.id) || todayList[0];
      setToday(mine || null);
      setRiwayat(history);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleCheckIn = async () => {
    setBusy(true);
    try {
      const record = await base44.entities.Absensi.create({
        karyawan_id: user?.id,
        karyawan_nama: user?.full_name || user?.email,
        tanggal: todayStr,
        jenis: "hadir",
        check_in: new Date().toISOString(),
        lokasi_check_in: "Kantor Pusat",
        catatan: "Check in via Mesin Absensi V2",
      });
      setToday(record);
      toast({ title: "Check In berhasil", description: `Pukul ${formatTime(record.check_in)}` });
      loadData();
    } catch (e) {
      toast({ title: "Gagal check in", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const handleCheckOut = async () => {
    if (!today) return;
    setBusy(true);
    try {
      const checkoutTime = new Date().toISOString();
      const durasi = calcDuration(today.check_in, checkoutTime);
      const updated = await base44.entities.Absensi.update(today.id, {
        check_out: checkoutTime,
        lokasi_check_out: "Kantor Pusat",
      });
      setToday({ ...today, ...updated });
      toast({ title: "Check Out berhasil", description: `Durasi kerja: ${durasi}` });
      loadData();
    } catch (e) {
      toast({ title: "Gagal check out", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 lg:p-8 flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  const hasCheckedIn = !!today?.check_in;
  const hasCheckedOut = !!today?.check_out;

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      <PageHeader title="Absensi" subtitle="Catat kehadiran harian Anda" />

      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit mb-6">
        {[
          { key: "absensi", label: "Check In/Out" },
          { key: "riwayat", label: "Riwayat" },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${tab === t.key ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "absensi" && (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-slate-200/70 p-8 text-center">
            <p className="text-5xl font-bold text-slate-900 tabular-nums">{currentTime}</p>
            <p className="text-sm text-slate-500 mt-1 capitalize">
              {new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </p>

            <div className="mt-8 space-y-3">
              {!hasCheckedIn && (
                <Button onClick={handleCheckIn} disabled={busy} className="w-full h-14 text-base bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 rounded-xl shadow-lg shadow-indigo-500/25">
                  <Fingerprint className="w-5 h-5 mr-2" /> Check In
                </Button>
              )}
              {hasCheckedIn && !hasCheckedOut && (
                <Button onClick={handleCheckOut} disabled={busy} className="w-full h-14 text-base bg-gradient-to-r from-rose-500 to-orange-600 hover:from-rose-600 hover:to-orange-700 rounded-xl shadow-lg shadow-rose-500/25">
                  <LogOut className="w-5 h-5 mr-2" /> Check Out
                </Button>
              )}
              {hasCheckedIn && hasCheckedOut && (
                <div className="w-full h-14 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-semibold text-sm">
                  ✓ Absensi hari ini selesai
                </div>
              )}
            </div>

            <div className="flex items-center justify-center gap-2 mt-6 text-xs text-slate-400">
              <MapPin className="w-3.5 h-3.5" /> Lokasi: Kantor Pusat
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200/70 p-6">
              <h3 className="font-semibold text-slate-900 mb-4">Status Hari Ini</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-3 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center"><Clock className="w-4 h-4 text-indigo-600" /></div>
                    <span className="text-sm text-slate-600">Check In</span>
                  </div>
                  <span className="font-semibold text-slate-900 tabular-nums">{formatTime(today?.check_in)}</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-rose-50 flex items-center justify-center"><LogOut className="w-4 h-4 text-rose-600" /></div>
                    <span className="text-sm text-slate-600">Check Out</span>
                  </div>
                  <span className="font-semibold text-slate-900 tabular-nums">{formatTime(today?.check_out)}</span>
                </div>
                <div className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center"><Calendar className="w-4 h-4 text-emerald-600" /></div>
                    <span className="text-sm text-slate-600">Durasi Kerja</span>
                  </div>
                  <span className="font-semibold text-slate-900">{calcDuration(today?.check_in, today?.check_out) || "--"}</span>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl p-6 text-white">
              <p className="text-sm text-indigo-100">Jenis Absensi Aktif</p>
              <p className="text-lg font-bold mt-1">Hadir · Reguler</p>
              <p className="text-xs text-indigo-200 mt-3">Jam kerja: 08:00 - 17:00 WIB</p>
            </div>
          </div>
        </div>
      )}

      {tab === "riwayat" && (
        <div className="bg-white rounded-2xl border border-slate-200/70 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr className="text-left text-slate-500">
                <th className="px-5 py-3 font-medium">Tanggal</th>
                <th className="px-5 py-3 font-medium">Karyawan</th>
                <th className="px-5 py-3 font-medium">Check In</th>
                <th className="px-5 py-3 font-medium">Check Out</th>
                <th className="px-5 py-3 font-medium">Jenis</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {riwayat.length === 0 && (
                <tr><td colSpan={5} className="px-5 py-12 text-center text-slate-400">Belum ada riwayat absensi</td></tr>
              )}
              {riwayat.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/50">
                  <td className="px-5 py-3 text-slate-900 font-medium">{r.tanggal}</td>
                  <td className="px-5 py-3 text-slate-600">{r.karyawan_nama || "-"}</td>
                  <td className="px-5 py-3 tabular-nums text-slate-600">{formatTime(r.check_in)}</td>
                  <td className="px-5 py-3 tabular-nums text-slate-600">{formatTime(r.check_out)}</td>
                  <td className="px-5 py-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      r.jenis === "hadir" ? "bg-emerald-50 text-emerald-700" :
                      r.jenis === "terlambat" ? "bg-amber-50 text-amber-700" :
                      r.jenis === "izin" || r.jenis === "sakit" ? "bg-sky-50 text-sky-700" :
                      "bg-rose-50 text-rose-700"
                    }`}>{r.jenis}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}