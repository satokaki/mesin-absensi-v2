import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { queryClientInstance } from "@/lib/query-client";

const CompanyContext = createContext(null);
const ACTIVE_COMPANY_KEY = "mesin_absensi_active_company";

export function CompanyProvider({ children }) {
  const { user, isAuthenticated } = useAuth();
  const [availableCompanies, setAvailableCompanies] = useState([]);
  const [memberships, setMemberships] = useState([]);
  const [activeCompany, setActiveCompany] = useState(null);
  const [isLoadingCompanies, setIsLoadingCompanies] = useState(true);
  // Base44 lama memakai role `admin`; dukung keduanya selama masa transisi.
  const isSuperAdmin = user?.role === "super_admin" || user?.role === "admin";

  const loadCompanies = useCallback(async () => {
    if (!isAuthenticated || !user?.id) {
      setAvailableCompanies([]);
      setMemberships([]);
      setActiveCompany(null);
      setIsLoadingCompanies(false);
      return;
    }

    setIsLoadingCompanies(true);
    try {
      const userMemberships = isSuperAdmin
        ? []
        : await base44.entities.UserCompany.filter({ user_id: user.id, status: "aktif" });

      const companies = isSuperAdmin
        ? await base44.entities.Perusahaan.filter({ status: "aktif" })
        : await Promise.all(
            userMemberships.map(async (membership) => {
              const matches = await base44.entities.Perusahaan.filter({ id: membership.company_id, status: "aktif" });
              return matches[0] || null;
            })
          );

      const allowedCompanies = companies.filter(Boolean);
      const savedId = window.sessionStorage.getItem(ACTIVE_COMPANY_KEY);
      const defaultMembership = userMemberships.find((item) => item.is_default);
      const selected =
        allowedCompanies.find((company) => company.id === savedId) ||
        allowedCompanies.find((company) => company.id === defaultMembership?.company_id) ||
        allowedCompanies[0] ||
        null;

      setMemberships(userMemberships);
      setAvailableCompanies(allowedCompanies);
      setActiveCompany(selected);

      if (selected) window.sessionStorage.setItem(ACTIVE_COMPANY_KEY, selected.id);
      else window.sessionStorage.removeItem(ACTIVE_COMPANY_KEY);
    } catch (error) {
      console.error("Gagal memuat perusahaan:", error);
      setMemberships([]);
      setAvailableCompanies([]);
      setActiveCompany(null);
    } finally {
      setIsLoadingCompanies(false);
    }
  }, [isAuthenticated, isSuperAdmin, user?.id]);

  useEffect(() => {
    loadCompanies();
  }, [loadCompanies]);

  const canAccessCompany = useCallback(
    (companyId) =>
      isSuperAdmin || availableCompanies.some((company) => company.id === companyId),
    [availableCompanies, isSuperAdmin]
  );

  const switchCompany = useCallback(
    async (companyId) => {
      if (!canAccessCompany(companyId)) throw new Error("Anda tidak memiliki akses ke perusahaan ini.");
      const company = availableCompanies.find((item) => item.id === companyId);
      if (!company) throw new Error("Perusahaan tidak ditemukan.");

      queryClientInstance.clear();
      window.sessionStorage.setItem(ACTIVE_COMPANY_KEY, company.id);
      setActiveCompany(company);
      return company;
    },
    [availableCompanies, canAccessCompany]
  );

  const activeMembership = memberships.find((item) => item.company_id === activeCompany?.id) || null;

  const value = useMemo(
    () => ({
      activeCompany,
      activeMembership,
      availableCompanies,
      memberships,
      isLoadingCompanies,
      isSuperAdmin,
      switchCompany,
      canAccessCompany,
      reloadCompanies: loadCompanies,
    }),
    [activeCompany, activeMembership, availableCompanies, memberships, isLoadingCompanies, isSuperAdmin, switchCompany, canAccessCompany, loadCompanies]
  );

  return <CompanyContext.Provider value={value}>{children}</CompanyContext.Provider>;
}

export function useCompany() {
  const context = useContext(CompanyContext);
  if (!context) throw new Error("useCompany harus digunakan di dalam CompanyProvider");
  return context;
}
