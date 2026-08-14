export const moduleStructure = [
  {
    group: "Utama",
    modules: [
      { label: "Dashboard", path: "/", sections: ["Ringkasan", "Statistik", "Grafik", "Pengumuman", "Notifikasi", "Shortcut"] },
      { label: "Absensi", path: "/absensi", sections: ["Check In", "Check Out", "Jenis Absensi", "Shift", "Riwayat", "Approval (Opsional)"] },
      { label: "Kunjungan", path: "/kunjungan", sections: ["Buat Kunjungan", "Check In", "Check Out", "Hasil Kunjungan", "Follow Up", "Riwayat"] },
    ],
  },
  {
    group: "Manajemen",
    modules: [
      { label: "Master Data", path: "/master-data", sections: ["Perusahaan", "Profil Perusahaan", "Cabang", "Departemen", "Jabatan", "Shift", "Titik Absensi", "Kalender Kerja", "Kategori Tunjangan", "Jenis Pinjaman", "Jenis Izin"] },
      { label: "Data Karyawan", path: "/karyawan", sections: ["Daftar Karyawan", "Biodata", "Penempatan", "Dokumen", "Akun Login", "Riwayat", "Status"] },
      { label: "Payroll", path: "/payrolls", sections: ["Komponen Gaji", "Generate Payroll", "Preview Payroll", "Approval Payroll", "Slip Gaji", "Riwayat Payroll"] },
      { label: "Pinjaman Karyawan", path: "/pinjaman", sections: ["Pengajuan", "Approval", "Cicilan", "Pelunasan", "Riwayat"] },
      { label: "Izin & Cuti", path: "/izin-cuti", sections: ["Pengajuan", "Approval", "Saldo", "Riwayat"] },
      { label: "Lembur", path: "/lembur", sections: ["Pengajuan", "Approval", "Perhitungan", "Riwayat"] },
      { label: "Pengumuman", path: "/pengumuman", sections: ["Buat", "Target", "Lampiran", "Riwayat"] },
    ],
  },
  {
    group: "Sistem",
    modules: [
      { label: "Laporan", path: "/laporan", sections: ["Absensi", "Kunjungan", "Payroll", "Pinjaman", "Izin", "Lembur", "Per Cabang", "Per Departemen", "Per Karyawan", "Export"] },
      { label: "Pengaturan", path: "/pengaturan", sections: ["GPS", "Selfie", "WhatsApp", "Email", "Notifikasi", "Preferensi Sistem"] },
      { label: "Administrator", path: "/administrator", sections: ["Manajemen User", "Role", "Hak Akses", "Import Data", "Export Data", "Backup", "Restore", "Log Aktivitas", "Audit"] },
    ],
  },
];

export const slugifySection = (value) =>
  value
    .toLowerCase()
    .replace(/\s*\(.*?\)\s*/g, "")
    .replace(/&/g, "dan")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

export const sectionRoutes = moduleStructure.flatMap(({ modules }) =>
  modules.flatMap((module) =>
    module.sections.map((section) => ({
      module: module.label,
      modulePath: module.path,
      section,
      path: `${module.path === "/" ? "/dashboard" : module.path}/${slugifySection(section)}`,
    }))
  )
);
