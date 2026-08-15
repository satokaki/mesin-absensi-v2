export const moduleStructure = [
  {
    group: "Utama",
    modules: [
      { key: "dashboard", label: "Dashboard", path: "/", sections: [] },
      { key: "absensi", label: "Absensi", path: "/absensi", sections: [] },
      { key: "kunjungan", label: "Kunjungan", path: "/kunjungan", sections: [] },
    ],
  },
  {
    group: "Manajemen",
    modules: [
      {
        key: "master_data",
        label: "Master Data",
        path: "/master-data",
        sections: [
          { key: "master_perusahaan", label: "Perusahaan", path: "/master-data/perusahaan" },
          { key: "titik_absensi", label: "Titik Absensi", path: "/master-data/titik-absensi" },
        ],
      },
      { key: "data_karyawan", label: "Data Karyawan", path: "/karyawan", sections: [] },
      { key: "payroll", label: "Payroll", path: "/payrolls", sections: [] },
      { key: "pinjaman", label: "Pinjaman Karyawan", path: "/pinjaman", sections: [] },
      { key: "izin_cuti", label: "Izin & Cuti", path: "/izin-cuti", sections: [] },
      { key: "lembur", label: "Lembur", path: "/lembur", sections: [] },
      { key: "pengumuman", label: "Pengumuman", path: "/pengumuman", sections: [] },
    ],
  },
  {
    group: "Sistem",
    modules: [
      { key: "laporan", label: "Laporan", path: "/laporan", sections: [] },
      { key: "pengaturan", label: "Pengaturan", path: "/pengaturan", sections: [] },
      { key: "administrator", label: "Administrator", path: "/administrator", sections: [] },
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
