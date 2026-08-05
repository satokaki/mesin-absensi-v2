import React, { useState } from "react";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { MapPin, Camera, Bell, Plug, Sliders } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const sections = [
  { key: "gps", label: "GPS & Lokasi", icon: MapPin, desc: "Verifikasi lokasi saat absensi" },
  { key: "selfie", label: "Selfie Wajib", icon: Camera, desc: "Foto saat check in/out" },
  { key: "notifikasi", label: "Notifikasi", icon: Bell, desc: "Push notification pengingat" },
  { key: "integrasi", label: "Integrasi", icon: Plug, desc: "Koneksi sistem eksternal" },
  { key: "preferensi", label: "Preferensi", icon: Sliders, desc: "Pengaturan umum aplikasi" },
];

export default function Pengaturan() {
  const { toast } = useToast();
  const [settings, setSettings] = useState({
    gps: true, selfie: true, notifikasi: true, radius_absen: 100, jam_masuk: "08:00", jam_keluar: "17:00",
  });

  const toggle = (key) => {
    setSettings({ ...settings, [key]: !settings[key] });
    toast({ title: "Pengaturan disimpan" });
  };

  const save = () => toast({ title: "Preferensi disimpan" });

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto">
      <PageHeader title="Pengaturan" subtitle="Konfigurasi sistem absensi" />

      <div className="space-y-4">
        {sections.map(({ key, label, icon: Icon, desc }) => (
          <div key={key} className="bg-white rounded-2xl border border-slate-200/70 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-indigo-50 flex items-center justify-center"><Icon className="w-5 h-5 text-indigo-600" /></div>
                <div>
                  <h3 className="font-semibold text-slate-900">{label}</h3>
                  <p className="text-sm text-slate-500">{desc}</p>
                </div>
              </div>
              {(key === "gps" || key === "selfie" || key === "notifikasi") && (
                <Switch checked={settings[key]} onCheckedChange={() => toggle(key)} />
              )}
            </div>
            {key === "gps" && settings.gps && (
              <div className="mt-4 pt-4 border-t border-slate-100">
                <Label>Radius Absensi (meter)</Label>
                <Input type="number" value={settings.radius_absen} onChange={(e) => setSettings({ ...settings, radius_absen: e.target.value })} className="max-w-xs mt-1" />
              </div>
            )}
            {key === "preferensi" && (
              <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 gap-3">
                <div><Label>Jam Masuk</Label><Input type="time" value={settings.jam_masuk} onChange={(e) => setSettings({ ...settings, jam_masuk: e.target.value })} /></div>
                <div><Label>Jam Keluar</Label><Input type="time" value={settings.jam_keluar} onChange={(e) => setSettings({ ...settings, jam_keluar: e.target.value })} /></div>
                <Button onClick={save} className="col-span-2 bg-indigo-600 hover:bg-indigo-700 mt-2">Simpan Preferensi</Button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}