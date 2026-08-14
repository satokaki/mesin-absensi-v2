import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Layers3 } from "lucide-react";
import PageHeader from "@/components/PageHeader";

export default function StructureSection({ module, modulePath, section }) {
  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      <PageHeader
        title={section}
        subtitle={`${module} · Mesin Absensi V2`}
      >
        <Link
          to={modulePath}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-600 hover:border-indigo-300 hover:text-indigo-600"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali
        </Link>
      </PageHeader>

      <div className="grid md:grid-cols-[1.4fr_0.6fr] gap-6">
        <section className="bg-white rounded-2xl border border-slate-200/70 p-6">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center mb-5">
            <Layers3 className="w-6 h-6 text-indigo-600" />
          </div>
          <h2 className="text-lg font-semibold text-slate-900">{section}</h2>
          <p className="text-sm leading-6 text-slate-500 mt-2">
            Struktur halaman {section} sudah tersedia dan terhubung ke navigasi {module}.
            Area ini siap diisi dengan form, tabel, approval, atau alur kerja sesuai kebutuhan operasional.
          </p>
        </section>

        <aside className="bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl p-6 text-white">
          <CheckCircle2 className="w-7 h-7 text-indigo-100" />
          <p className="font-semibold mt-4">Route aktif</p>
          <p className="text-sm text-indigo-100 mt-1">
            Menu dapat dibuka dan tidak lagi mengarah ke halaman 404.
          </p>
        </aside>
      </div>
    </div>
  );
}
