import React, { useEffect, useState } from "react";
import { Outlet, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { useCompany } from "@/lib/CompanyContext";
import { moduleStructure } from "@/lib/moduleStructure";
import CompanySwitcher from "@/components/CompanySwitcher";
import {
  LayoutDashboard,
  Fingerprint,
  MapPin,
  Database,
  Users,
  Wallet,
  Landmark,
  CalendarClock,
  Clock,
  Megaphone,
  FileBarChart,
  Settings,
  Shield,
  LogOut,
  Menu,
  Bell,
  ChevronDown,
} from "lucide-react";

const moduleIcons = {
  Dashboard: LayoutDashboard,
  Absensi: Fingerprint,
  Kunjungan: MapPin,
  "Master Data": Database,
  "Data Karyawan": Users,
  Payroll: Wallet,
  "Pinjaman Karyawan": Landmark,
  "Izin & Cuti": CalendarClock,
  Lembur: Clock,
  Pengumuman: Megaphone,
  Laporan: FileBarChart,
  Pengaturan: Settings,
  Administrator: Shield,
};

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const [expanded, setExpanded] = useState({});

  const { user, logout } = useAuth();
  const { canAccessMenu } = useCompany();

  const navigate = useNavigate();
  const navSections = moduleStructure
    .map(({ group, modules }) => ({
      label: group,
      items: modules
        .map((item) => {
          const sections = item.sections.filter((section) => canAccessMenu(section.key));
          const allowed = canAccessMenu(item.key) || sections.length > 0;
          if (!allowed) return null;

          return {
            ...item,
            sections,
            to: item.path,
            icon: moduleIcons[item.label],
            end: item.path === "/",
          };
        })
        .filter(Boolean),
    }))
    .filter((section) => section.items.length > 0);

  useEffect(() => {
    const active = navSections
      .flatMap((section) => section.items)
      .find((item) =>
        item.to === "/"
          ? location.pathname === "/" || location.pathname.startsWith("/dashboard/")
          : location.pathname === item.to || location.pathname.startsWith(`${item.to}/`)
      );

    if (active) {
      setExpanded((current) => ({ ...current, [active.to]: true }));
    }
  }, [location.pathname]);

  const handleLogout = () => {
    logout(false);
    navigate("/login");
  };

  const Sidebar = (
    <aside className="w-72 bg-slate-900 text-slate-300 flex flex-col h-full">

      {/* LOGO */}
      <div className="px-6 py-5 flex items-center gap-3 border-b border-slate-800">

        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
          <Fingerprint className="w-5 h-5 text-white" />
        </div>

        <div>
          <h1 className="text-white font-bold text-sm tracking-tight">
            Mesin Absensi
          </h1>

          <p className="text-[10px] text-slate-500 font-medium tracking-widest uppercase">
            V2 · Workforce
          </p>
        </div>

      </div>

      {/* NAVIGATION */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6">

        {navSections.map((section) => (
          <div key={section.label}>

            <p className="px-3 mb-2 text-[10px] font-semibold tracking-widest uppercase text-slate-600">
              {section.label}
            </p>

            <div className="space-y-0.5">

              {section.items.map(({ to, label, icon: Icon, end, sections }) => {
                const isExpanded = !!expanded[to];

                return (
                  <div key={to}>
                    <div className="flex items-center gap-1">
                      <NavLink
                        to={to}
                        end={end}
                        onClick={() => setMobileOpen(false)}
                        className={({ isActive }) =>
                          `flex-1 flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                            isActive
                              ? "bg-indigo-500/15 text-indigo-300 shadow-sm"
                              : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
                          }`
                        }
                      >
                        <Icon className="w-[18px] h-[18px] shrink-0" />
                        {label}
                      </NavLink>

                      {sections.length > 0 && <button
                        type="button"
                        aria-label={`${isExpanded ? "Tutup" : "Buka"} submenu ${label}`}
                        aria-expanded={isExpanded}
                        onClick={() => setExpanded((current) => ({ ...current, [to]: !current[to] }))}
                        className="p-2 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-slate-800/60"
                      >
                        <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                      </button>}
                    </div>

                    {sections.length > 0 && isExpanded && (
                      <div className="ml-6 pl-3 border-l border-slate-800 py-1 space-y-0.5">
                        {sections.map((section) => {
                          return (
                            <NavLink
                              key={section.path}
                              to={section.path}
                              onClick={() => setMobileOpen(false)}
                              className={({ isActive }) =>
                                `block px-3 py-1.5 rounded-md text-xs transition-colors ${
                                  isActive
                                    ? "bg-indigo-500/10 text-indigo-300"
                                    : "text-slate-500 hover:text-slate-300 hover:bg-slate-800/50"
                                }`
                              }
                            >
                              {section.label}
                            </NavLink>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}

            </div>

          </div>
        ))}

      </nav>

      {/* USER / LOGOUT */}
      <div className="p-3 border-t border-slate-800">

        <div
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-800/60 cursor-pointer"
          onClick={handleLogout}
        >

          <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center text-white text-xs font-bold">

            {(user?.full_name || user?.email || "U")
              .charAt(0)
              .toUpperCase()}

          </div>

          <div className="flex-1 min-w-0">

            <p className="text-sm font-medium text-white truncate">
              {user?.full_name ||
                user?.email ||
                "Pengguna"}
            </p>

            <p className="text-[11px] text-slate-500">
              Keluar
            </p>

          </div>

          <LogOut className="w-4 h-4 text-slate-500" />

        </div>

      </div>

    </aside>
  );

  return (
    <div className="flex h-screen bg-slate-50">

      {/* DESKTOP SIDEBAR */}
      <div className="hidden lg:flex h-full">
        {Sidebar}
      </div>

      {/* MOBILE SIDEBAR */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">

          <div
            className="absolute inset-0 bg-black/50"
            onClick={() =>
              setMobileOpen(false)
            }
          />

          <div className="absolute left-0 top-0 h-full">
            {Sidebar}
          </div>

        </div>
      )}

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* HEADER */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-8 shrink-0">

          <button
            className="lg:hidden p-2 -ml-2"
            onClick={() =>
              setMobileOpen(true)
            }
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex-1 lg:flex hidden">

            <p className="text-sm text-slate-500">
              {new Date().toLocaleDateString(
                "id-ID",
                {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                }
              )}
            </p>

          </div>

          <div className="flex items-center gap-3">

            <CompanySwitcher />

            <button className="relative p-2 rounded-lg hover:bg-slate-100">

              <Bell className="w-5 h-5 text-slate-600" />

              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full" />

            </button>

          </div>

        </header>

        {/* PAGE CONTENT */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>

      </div>

    </div>
  );
}
