export const moduleStructure = [
  {
    group: "Utama",
    modules: [
      { label: "Dashboard", path: "/", sections: [] },
      { label: "Absensi", path: "/absensi", sections: [] },
      { label: "Kunjungan", path: "/kunjungan", sections: [] },
    ],
  },
  {
    group: "Manajemen",
    modules: [
      { label: "Master Data", path: "/master-data", sections: ["Perusahaan", "Titik Absensi"] },
      { label: "Data Karyawan", path: "/karyawan", sections: [] },
      { label: "Payroll", path: "/payrolls", sections: [] },
      { label: "Pinjaman Karyawan", path: "/pinjaman", sections: [] },
      { label: "Izin & Cuti", path: "/izin-cuti", sections: [] },
      { label: "Lembur", path: "/lembur", sections: [] },
      { label: "Pengumuman", path: "/pengumuman", sections: [] },
    ],
  },
  {
    group: "Sistem",
    modules: [
      { label: "Laporan", path: "/laporan", sections: [] },
      { label: "Pengaturan", path: "/pengaturan", sections: [] },
      { label: "Administrator", path: "/administrator", sections: [] },
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
