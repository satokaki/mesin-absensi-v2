import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, ChevronDown, Loader2 } from "lucide-react";
import { useCompany } from "@/lib/CompanyContext";

export default function CompanySwitcher() {
  const navigate = useNavigate();
  const { activeCompany, availableCompanies, isLoadingCompanies, switchCompany } = useCompany();
  const [switching, setSwitching] = useState(false);

  const handleChange = async (event) => {
    setSwitching(true);
    try {
      await switchCompany(event.target.value);
      navigate("/");
    } finally {
      setSwitching(false);
    }
  };

  if (isLoadingCompanies) {
    return (
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Loader2 className="w-4 h-4 animate-spin" /> Memuat perusahaan
      </div>
    );
  }

  if (!activeCompany) {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700">
        <Building2 className="w-4 h-4" /> Belum ada perusahaan
      </div>
    );
  }

  return (
    <label className="relative flex items-center gap-2 min-w-0 rounded-lg border border-slate-200 bg-white px-3 py-2 hover:border-indigo-300">
      {activeCompany.logo_url ? (
        <img src={activeCompany.logo_url} alt="" className="w-5 h-5 rounded object-cover" />
      ) : (
        <Building2 className="w-4 h-4 text-indigo-600 shrink-0" />
      )}
      <span className="sr-only">Perusahaan aktif</span>
      <select
        value={activeCompany.id}
        onChange={handleChange}
        disabled={switching || availableCompanies.length < 2}
        className="appearance-none bg-transparent pr-5 text-sm font-medium text-slate-700 outline-none max-w-[180px] truncate disabled:cursor-default"
      >
        {availableCompanies.map((company) => (
          <option key={company.id} value={company.id}>{company.nama}</option>
        ))}
      </select>
      {switching ? (
        <Loader2 className="absolute right-2 w-3.5 h-3.5 animate-spin text-slate-400" />
      ) : (
        availableCompanies.length > 1 && <ChevronDown className="absolute right-2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
      )}
    </label>
  );
}
