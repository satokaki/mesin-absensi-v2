import React, { useEffect, useMemo, useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import {
  Fingerprint,
  LogOut,
  Clock,
  MapPin,
  Camera,
  Calendar,
  Navigation,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

/**
 * ============================================================
 * ABSENSI V3
 * GPS + RADIUS + SELFIE
 *
 * DATA-AFFECTING:
 * - Menambahkan GPS proof
 * - Menambahkan radius validation
 * - Menambahkan selfie proof
 * - Menambahkan TitikAbsensi sebagai master lokasi
 * ============================================================
 */

function formatTime(iso) {
  if (!iso) return "--:--";

  return new Date(iso).toLocaleTimeString("id-ID", {
    timeZone: "Asia/Jakarta",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getWibDateString(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const year = parts.find((p) => p.type === "year")?.value;
  const month = parts.find((p) => p.type === "month")?.value;
  const day = parts.find((p) => p.type === "day")?.value;

  return `${year}-${month}-${day}`;
}

function formatDateWib(date = new Date()) {
  return date.toLocaleDateString("id-ID", {
    timeZone: "Asia/Jakarta",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatClockWib(date = new Date()) {
  return date.toLocaleTimeString("id-ID", {
    timeZone: "Asia/Jakarta",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function calcDuration(inTime, outTime) {
  if (!inTime || !outTime) return null;

  const diff = new Date(outTime) - new Date(inTime);

  if (!Number.isFinite(diff) || diff < 0) return null;

  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);

  return `${h}j ${m}m`;
}

/**
 * Haversine distance.
 * Return dalam meter.
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000;

  const toRad = (degree) => (degree * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(
        new Error(
          "Browser/perangkat ini tidak mendukung GPS atau Location Service."
        )
      );
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp,
        });
      },
      (error) => {
        let message = "Lokasi tidak dapat dibaca.";

        switch (error.code) {
          case error.PERMISSION_DENIED:
            message =
              "Izin lokasi ditolak. Aktifkan permission lokasi untuk melakukan absensi.";
            break;

          case error.POSITION_UNAVAILABLE:
            message =
              "Lokasi perangkat tidak tersedia. Pastikan GPS aktif.";
            break;

          case error.TIMEOUT:
            message =
              "GPS membutuhkan waktu terlalu lama. Silakan coba kembali.";
            break;

          default:
            break;
        }

        reject(new Error(message));
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  });
}

export default function Absensi() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [today, setToday] = useState(null);
  const [riwayat, setRiwayat] = useState([]);

  const [titikAbsensi, setTitikAbsensi] = useState([]);

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const [tab, setTab] = useState("absensi");

  const [clock, setClock] = useState(new Date());

  const [gpsLoading, setGpsLoading] = useState(false);
  const [gps, setGps] = useState(null);
  const [matchedPoint, setMatchedPoint] = useState(null);

  const [selfieFile, setSelfieFile] = useState(null);
  const [selfiePreview, setSelfiePreview] = useState(null);

  const selfieInputRef = useRef(null);

  const todayStr = useMemo(() => getWibDateString(clock), [clock]);

  /**
   * ============================================================
   * LIVE CLOCK
   * ============================================================
   */

  useEffect(() => {
    const timer = setInterval(() => {
      setClock(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  /**
   * ============================================================
   * LOAD DATA
   * ============================================================
   */

  const loadData = async () => {
    if (!user?.id) return;

    try {
      const [todayList, history, points] = await Promise.all([
        base44.entities.Absensi.filter({
          tanggal: getWibDateString(),
          karyawan_id: user.id,
        }),

        base44.entities.Absensi.filter(
          {
            karyawan_id: user.id,
          },
          "-tanggal",
          30
        ),

        base44.entities.TitikAbsensi.filter({
          status: "aktif",
        }),
      ]);

      /**
       * IMPORTANT:
       * Jangan fallback ke todayList[0] milik user lain.
       */
      const mine =
        todayList.find((a) => a.karyawan_id === user.id) || null;

      setToday(mine);

      setRiwayat(
        (history || []).filter((item) => item.karyawan_id === user.id)
      );

      setTitikAbsensi(points || []);
    } catch (e) {
      console.error("loadData error:", e);

      toast({
        title: "Gagal membaca data absensi",
        description: e?.message || "Terjadi kesalahan.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      loadData();
    }
  }, [user?.id]);

  /**
   * ============================================================
   * GPS
   * ============================================================
   */

  const validateGps = async () => {
    if (!titikAbsensi.length) {
      throw new Error(
        "Belum ada Titik Absensi aktif. Hubungi administrator."
      );
    }

    setGpsLoading(true);

    try {
      const position = await getCurrentPosition();

      /**
       * Cari titik absensi terdekat.
       */
      const pointsWithDistance = titikAbsensi
        .map((point) => {
          const latitude = Number(point.latitude);
          const longitude = Number(point.longitude);
          const radius = Number(point.radius_meter || 0);

          if (
            !Number.isFinite(latitude) ||
            !Number.isFinite(longitude) ||
            radius <= 0
          ) {
            return null;
          }

          const distance = calculateDistance(
            position.latitude,
            position.longitude,
            latitude,
            longitude
          );

          return {
            ...point,
            distance,
            radius,
          };
        })
        .filter(Boolean)
        .sort((a, b) => a.distance - b.distance);

      if (!pointsWithDistance.length) {
        throw new Error(
          "Konfigurasi Titik Absensi tidak valid. Hubungi administrator."
        );
      }

      const nearestPoint = pointsWithDistance[0];

      const validatedGps = {
        ...position,
        distance: nearestPoint.distance,
        radius: nearestPoint.radius,
        insideRadius: nearestPoint.distance <= nearestPoint.radius,
      };

      setGps(validatedGps);
      setMatchedPoint(nearestPoint);

      return {
        gps: validatedGps,
        point: nearestPoint,
      };
    } finally {
      setGpsLoading(false);
    }
  };

  const handleRefreshGps = async () => {
    try {
      const result = await validateGps();

      if (result.gps.insideRadius) {
        toast({
          title: "Lokasi valid",
          description: `${Math.round(
            result.gps.distance
          )} meter dari ${result.point.nama}`,
        });
      } else {
        toast({
          title: "Di luar radius absensi",
          description: `Jarak ${Math.round(
            result.gps.distance
          )} m · Radius maksimal ${Math.round(result.gps.radius)} m`,
          variant: "destructive",
        });
      }
    } catch (e) {
      toast({
        title: "GPS gagal dibaca",
        description: e?.message,
        variant: "destructive",
      });
    }
  };

  /**
   * ============================================================
   * SELFIE
   * ============================================================
   */

  const handleSelfieChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({
        title: "File tidak valid",
        description: "Selfie harus berupa gambar.",
        variant: "destructive",
      });
      return;
    }

    /**
     * Safety sederhana untuk file terlalu besar.
     */
    const maxFileSize = 8 * 1024 * 1024;

    if (file.size > maxFileSize) {
      toast({
        title: "Foto terlalu besar",
        description: "Ukuran selfie maksimal 8 MB.",
        variant: "destructive",
      });
      return;
    }

    if (selfiePreview) {
      URL.revokeObjectURL(selfiePreview);
    }

    const preview = URL.createObjectURL(file);

    setSelfieFile(file);
    setSelfiePreview(preview);
  };

  useEffect(() => {
    return () => {
      if (selfiePreview) {
        URL.revokeObjectURL(selfiePreview);
      }
    };
  }, [selfiePreview]);

  const uploadSelfie = async () => {
    if (!selfieFile) {
      throw new Error("Selfie wajib dilakukan sebelum Check In.");
    }

    /**
     * Standard Base44 file uploader.
     */
    const result = await base44.integrations.Core.UploadFile({
      file: selfieFile,
    });

    const fileUrl =
      result?.file_url ||
      result?.url ||
      result?.fileUrl;

    if (!fileUrl) {
      throw new Error("Upload selfie gagal.");
    }

    return fileUrl;
  };

  /**
   * ============================================================
   * CHECK IN
   * ============================================================
   */

  const handleCheckIn = async () => {
    if (busy) return;

    if (!user?.id) {
      toast({
        title: "User tidak ditemukan",
        variant: "destructive",
      });
      return;
    }

    if (!selfieFile) {
      toast({
        title: "Selfie wajib",
        description: "Ambil selfie terlebih dahulu.",
        variant: "destructive",
      });

      selfieInputRef.current?.click();
      return;
    }

    setBusy(true);

    try {
      /**
       * STEP 1
       * Cek ulang database untuk mencegah double check-in.
       */
      const existing = await base44.entities.Absensi.filter({
        tanggal: getWibDateString(),
        karyawan_id: user.id,
      });

      const existingRecord = existing?.find(
        (item) => item.karyawan_id === user.id
      );

      if (existingRecord?.check_in) {
        setToday(existingRecord);

        throw new Error("Anda sudah melakukan Check In hari ini.");
      }

      /**
       * STEP 2
       * GPS wajib dibaca fresh saat submit.
       */
      const {
        gps: currentGps,
        point,
      } = await validateGps();

      if (!currentGps.insideRadius) {
        throw new Error(
          `Anda berada ${Math.round(
            currentGps.distance
          )} meter dari ${point.nama}. Radius absensi maksimal ${Math.round(
            currentGps.radius
          )} meter.`
        );
      }

      /**
       * STEP 3
       * Upload selfie.
       */
      const selfieUrl = await uploadSelfie();

      /**
       * STEP 4
       * Create attendance.
       */
      const record = await base44.entities.Absensi.create({
        karyawan_id: user.id,

        karyawan_nama:
          user?.full_name ||
          user?.email ||
          "Unknown",

        tanggal: getWibDateString(),

        jenis: "hadir",

        check_in: new Date().toISOString(),

        titik_absensi_id: point.id,
        titik_absensi_nama: point.nama,

        lokasi_check_in: point.nama,

        latitude_check_in: currentGps.latitude,
        longitude_check_in: currentGps.longitude,

        akurasi_check_in: currentGps.accuracy,

        jarak_check_in: Math.round(
          currentGps.distance
        ),

        selfie_check_in_url: selfieUrl,

        catatan: "Check in via Mesin Absensi GPS + Selfie",
      });

      setToday(record);

      setSelfieFile(null);

      if (selfiePreview) {
        URL.revokeObjectURL(selfiePreview);
      }

      setSelfiePreview(null);

      toast({
        title: "Check In berhasil",
        description: `${formatTime(
          record.check_in
        )} · ${Math.round(currentGps.distance)} m dari ${point.nama}`,
      });

      await loadData();
    } catch (e) {
      console.error("check-in error:", e);

      toast({
        title: "Check In gagal",
        description: e?.message || "Terjadi kesalahan.",
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  };

  /**
   * ============================================================
   * CHECK OUT
   * ============================================================
   */

  const handleCheckOut = async () => {
    if (!today || busy) return;

    if (today.check_out) {
      toast({
        title: "Check Out sudah dilakukan",
      });

      return;
    }

    setBusy(true);

    try {
      /**
       * GPS fresh juga wajib saat checkout.
       */
      const {
        gps: currentGps,
        point,
      } = await validateGps();

      if (!currentGps.insideRadius) {
        throw new Error(
          `Check Out ditolak. Anda berada ${Math.round(
            currentGps.distance
          )} meter dari ${point.nama}. Radius maksimal ${Math.round(
            currentGps.radius
          )} meter.`
        );
      }

      const checkoutTime = new Date().toISOString();

      const durasi = calcDuration(
        today.check_in,
        checkoutTime
      );

      const updated =
        await base44.entities.Absensi.update(
          today.id,
          {
            check_out: checkoutTime,

            lokasi_check_out: point.nama,

            latitude_check_out:
              currentGps.latitude,

            longitude_check_out:
              currentGps.longitude,

            akurasi_check_out:
              currentGps.accuracy,

            jarak_check_out: Math.round(
              currentGps.distance
            ),
          }
        );

      setToday({
        ...today,
        ...updated,
      });

      toast({
        title: "Check Out berhasil",
        description: `Durasi kerja: ${durasi}`,
      });

      await loadData();
    } catch (e) {
      console.error("checkout error:", e);

      toast({
        title: "Check Out gagal",
        description: e?.message || "Terjadi kesalahan.",
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  };

  /**
   * ============================================================
   * STATUS
   * ============================================================
   */

  const hasCheckedIn = !!today?.check_in;
  const hasCheckedOut = !!today?.check_out;

  if (loading) {
    return (
      <div className="p-6 lg:p-8 flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      <PageHeader
        title="Absensi"
        subtitle="Absensi GPS dengan validasi lokasi dan selfie"
      />

      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit mb-6">
        {[
          {
            key: "absensi",
            label: "Check In/Out",
          },
          {
            key: "riwayat",
            label: "Riwayat",
          },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === t.key
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "absensi" && (
        <div className="grid md:grid-cols-2 gap-6">

          {/* LEFT CARD */}
          <div className="bg-white rounded-2xl border border-slate-200/70 p-8 text-center">

            <p className="text-5xl font-bold text-slate-900 tabular-nums">
              {formatClockWib(clock)}
            </p>

            <p className="text-sm text-slate-500 mt-1 capitalize">
              {formatDateWib(clock)}
            </p>

            {/* GPS STATUS */}
            <div className="mt-6">
              {!gps && (
                <button
                  type="button"
                  onClick={handleRefreshGps}
                  disabled={gpsLoading}
                  className="w-full rounded-xl border border-slate-200 p-4 hover:bg-slate-50 transition"
                >
                  <div className="flex items-center justify-center gap-2 text-sm font-medium text-slate-700">

                    {gpsLoading ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Navigation className="w-4 h-4" />
                    )}

                    {gpsLoading
                      ? "Membaca GPS..."
                      : "Periksa Lokasi"}
                  </div>
                </button>
              )}

              {gps && matchedPoint && (
                <div
                  className={`rounded-xl p-4 ${
                    gps.insideRadius
                      ? "bg-emerald-50 border border-emerald-100"
                      : "bg-rose-50 border border-rose-100"
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">

                    {gps.insideRadius ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-rose-600" />
                    )}

                    <span
                      className={`font-semibold text-sm ${
                        gps.insideRadius
                          ? "text-emerald-700"
                          : "text-rose-700"
                      }`}
                    >
                      {gps.insideRadius
                        ? "Lokasi Valid"
                        : "Di Luar Radius"}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 mt-2">
                    {matchedPoint.nama}
                  </p>

                  <p className="text-xs text-slate-500 mt-1">
                    Jarak:{" "}
                    <strong>
                      {Math.round(gps.distance)} m
                    </strong>
                    {" · "}
                    Radius:{" "}
                    <strong>
                      {Math.round(gps.radius)} m
                    </strong>
                  </p>

                  <p className="text-[11px] text-slate-400 mt-1">
                    Akurasi GPS ±
                    {Math.round(gps.accuracy || 0)} m
                  </p>

                  <button
                    type="button"
                    onClick={handleRefreshGps}
                    className="mt-3 text-xs font-medium text-indigo-600 hover:text-indigo-700"
                  >
                    Perbarui lokasi
                  </button>
                </div>
              )}
            </div>

            {/* SELFIE */}
            {!hasCheckedIn && (
              <div className="mt-4">

                <input
                  ref={selfieInputRef}
                  type="file"
                  accept="image/*"
                  capture="user"
                  onChange={handleSelfieChange}
                  className="hidden"
                />

                {!selfiePreview ? (
                  <button
                    type="button"
                    onClick={() =>
                      selfieInputRef.current?.click()
                    }
                    className="w-full min-h-[120px] border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center hover:bg-slate-50 hover:border-indigo-300 transition"
                  >
                    <Camera className="w-7 h-7 text-slate-400" />

                    <span className="text-sm font-medium text-slate-700 mt-2">
                      Ambil Selfie
                    </span>

                    <span className="text-xs text-slate-400 mt-1">
                      Wajib sebelum Check In
                    </span>
                  </button>
                ) : (
                  <div className="relative rounded-xl overflow-hidden border border-slate-200">

                    <img
                      src={selfiePreview}
                      alt="Selfie preview"
                      className="w-full h-48 object-cover"
                    />

                    <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/60 to-transparent">

                      <button
                        type="button"
                        onClick={() =>
                          selfieInputRef.current?.click()
                        }
                        className="text-white text-xs font-medium"
                      >
                        Ambil ulang selfie
                      </button>

                    </div>
                  </div>
                )}
              </div>
            )}

            {/* CHECK IN / OUT */}
            <div className="mt-6 space-y-3">

              {!hasCheckedIn && (
                <Button
                  onClick={handleCheckIn}
                  disabled={busy || gpsLoading}
                  className="w-full h-14 text-base bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 rounded-xl shadow-lg shadow-indigo-500/25"
                >
                  <Fingerprint className="w-5 h-5 mr-2" />

                  {busy
                    ? "Memproses..."
                    : "Check In"}
                </Button>
              )}

              {hasCheckedIn && !hasCheckedOut && (
                <Button
                  onClick={handleCheckOut}
                  disabled={busy || gpsLoading}
                  className="w-full h-14 text-base bg-gradient-to-r from-rose-500 to-orange-600 hover:from-rose-600 hover:to-orange-700 rounded-xl shadow-lg shadow-rose-500/25"
                >
                  <LogOut className="w-5 h-5 mr-2" />

                  {busy
                    ? "Memproses..."
                    : "Check Out"}
                </Button>
              )}

              {hasCheckedIn && hasCheckedOut && (
                <div className="w-full h-14 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-semibold text-sm">
                  ✓ Absensi hari ini selesai
                </div>
              )}

            </div>

            <div className="flex items-center justify-center gap-2 mt-6 text-xs text-slate-400">
              <MapPin className="w-3.5 h-3.5" />

              {today?.titik_absensi_nama ||
                matchedPoint?.nama ||
                "Lokasi belum diverifikasi"}
            </div>
          </div>

          {/* RIGHT */}
          <div className="space-y-4">

            <div className="bg-white rounded-2xl border border-slate-200/70 p-6">

              <h3 className="font-semibold text-slate-900 mb-4">
                Status Hari Ini
              </h3>

              <div className="space-y-3">

                <div className="flex items-center justify-between py-3 border-b border-slate-100">

                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center">
                      <Clock className="w-4 h-4 text-indigo-600" />
                    </div>

                    <span className="text-sm text-slate-600">
                      Check In
                    </span>
                  </div>

                  <span className="font-semibold text-slate-900 tabular-nums">
                    {formatTime(today?.check_in)}
                  </span>

                </div>

                <div className="flex items-center justify-between py-3 border-b border-slate-100">

                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-rose-50 flex items-center justify-center">
                      <LogOut className="w-4 h-4 text-rose-600" />
                    </div>

                    <span className="text-sm text-slate-600">
                      Check Out
                    </span>
                  </div>

                  <span className="font-semibold text-slate-900 tabular-nums">
                    {formatTime(today?.check_out)}
                  </span>

                </div>

                <div className="flex items-center justify-between py-3 border-b border-slate-100">

                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                      <Calendar className="w-4 h-4 text-emerald-600" />
                    </div>

                    <span className="text-sm text-slate-600">
                      Durasi Kerja
                    </span>
                  </div>

                  <span className="font-semibold text-slate-900">
                    {calcDuration(
                      today?.check_in,
                      today?.check_out
                    ) || "--"}
                  </span>

                </div>

                <div className="flex items-center justify-between py-3">

                  <div className="flex items-center gap-3">

                    <div className="w-10 h-10 rounded-lg bg-sky-50 flex items-center justify-center">
                      <MapPin className="w-4 h-4 text-sky-600" />
                    </div>

                    <span className="text-sm text-slate-600">
                      Lokasi
                    </span>

                  </div>

                  <div className="text-right">

                    <p className="font-semibold text-sm text-slate-900">
                      {today?.titik_absensi_nama ||
                        matchedPoint?.nama ||
                        "--"}
                    </p>

                    {today?.jarak_check_in != null && (
                      <p className="text-xs text-slate-400">
                        {Math.round(
                          Number(today.jarak_check_in)
                        )}{" "}
                        meter
                      </p>
                    )}

                  </div>

                </div>

              </div>
            </div>

            <div className="bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl p-6 text-white">

              <p className="text-sm text-indigo-100">
                Jenis Absensi Aktif
              </p>

              <p className="text-lg font-bold mt-1">
                Hadir · GPS + Selfie
              </p>

              <p className="text-xs text-indigo-200 mt-3">
                Jam kerja: 08:00 - 17:00 WIB
              </p>

            </div>

          </div>
        </div>
      )}

      {tab === "riwayat" && (
        <div className="bg-white rounded-2xl border border-slate-200/70 overflow-x-auto">

          <table className="w-full text-sm min-w-[760px]">

            <thead className="bg-slate-50 border-b border-slate-200">

              <tr className="text-left text-slate-500">

                <th className="px-5 py-3 font-medium">
                  Tanggal
                </th>

                <th className="px-5 py-3 font-medium">
                  Karyawan
                </th>

                <th className="px-5 py-3 font-medium">
                  Check In
                </th>

                <th className="px-5 py-3 font-medium">
                  Check Out
                </th>

                <th className="px-5 py-3 font-medium">
                  Lokasi
                </th>

                <th className="px-5 py-3 font-medium">
                  Jenis
                </th>

              </tr>

            </thead>

            <tbody className="divide-y divide-slate-100">

              {riwayat.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-12 text-center text-slate-400"
                  >
                    Belum ada riwayat absensi
                  </td>
                </tr>
              )}

              {riwayat.map((r) => (
                <tr
                  key={r.id}
                  className="hover:bg-slate-50/50"
                >

                  <td className="px-5 py-3 text-slate-900 font-medium">
                    {r.tanggal}
                  </td>

                  <td className="px-5 py-3 text-slate-600">
                    {r.karyawan_nama || "-"}
                  </td>

                  <td className="px-5 py-3 tabular-nums text-slate-600">
                    {formatTime(r.check_in)}
                  </td>

                  <td className="px-5 py-3 tabular-nums text-slate-600">
                    {formatTime(r.check_out)}
                  </td>

                  <td className="px-5 py-3 text-slate-600">

                    <div>
                      {r.titik_absensi_nama ||
                        r.lokasi_check_in ||
                        "-"}
                    </div>

                    {r.jarak_check_in != null && (
                      <div className="text-xs text-slate-400 mt-0.5">
                        {Math.round(
                          Number(r.jarak_check_in)
                        )}{" "}
                        m
                      </div>
                    )}

                  </td>

                  <td className="px-5 py-3">

                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        r.jenis === "hadir"
                          ? "bg-emerald-50 text-emerald-700"
                          : r.jenis === "terlambat"
                          ? "bg-amber-50 text-amber-700"
                          : r.jenis === "izin" ||
                            r.jenis === "sakit"
                          ? "bg-sky-50 text-sky-700"
                          : "bg-rose-50 text-rose-700"
                      }`}
                    >
                      {r.jenis}
                    </span>

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