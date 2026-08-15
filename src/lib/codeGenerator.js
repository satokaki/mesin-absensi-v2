const PREFIXES = {
  perusahaan: "CMP", cabang: "CBG", departemen: "DPT", jabatan: "JBT", shift: "SFT",
  karyawan: "KRY", titik_absensi: "LOC", absensi: "ABS", kunjungan: "KJG",
  payroll: "PAY", slip_gaji: "SLP", pinjaman: "PJM", cicilan: "CCL",
  izin: "IZN", lembur: "LBR", pengumuman: "PGM", laporan: "LAP",
};

const clean = (value, fallback) => {
  const normalized = String(value || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  return normalized.slice(0, 6) || fallback;
};

const datePart = (date = new Date()) => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta", year: "2-digit", month: "2-digit", day: "2-digit",
  }).formatToParts(date);
  return ["year", "month", "day"].map((type) => parts.find((part) => part.type === type)?.value).join("");
};

const randomPart = () => {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID().replace(/-/g, "").slice(0, 6).toUpperCase();
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`.slice(-6).toUpperCase();
};

export function generateBusinessCode(type, company, options = {}) {
  const prefix = PREFIXES[type] || clean(type, "DOC").slice(0, 3);
  const companyCode = clean(company?.kode || company?.nama, "CMP");
  return [prefix, companyCode, datePart(options.date), randomPart()].join("-");
}

export function withGeneratedCode(type, field, company, payload = {}) {
  return { ...payload, [field]: payload[field] || generateBusinessCode(type, company) };
}
