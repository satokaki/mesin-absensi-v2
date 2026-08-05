import React from "react";

export default function StatCard({ icon: Icon, label, value, trend, color = "indigo" }) {
  const colorMap = {
    indigo: "bg-indigo-50 text-indigo-600",
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    rose: "bg-rose-50 text-rose-600",
    sky: "bg-sky-50 text-sky-600",
    violet: "bg-violet-50 text-violet-600",
  };
  return (
    <div className="bg-white rounded-2xl border border-slate-200/70 p-5 hover:shadow-md hover:shadow-slate-200/50 transition-shadow">
      <div className="flex items-start justify-between">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${colorMap[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
        {trend && (
          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${trend.startsWith("-") ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600"}`}>
            {trend}
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-slate-900 mt-4">{value}</p>
      <p className="text-sm text-slate-500 mt-0.5">{label}</p>
    </div>
  );
}