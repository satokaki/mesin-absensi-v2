export function requireActiveCompany(activeCompany) {
  if (!activeCompany?.id) throw new Error("Pilih perusahaan aktif terlebih dahulu.");
  return activeCompany;
}

export function companyFilter(activeCompany, filters = {}) {
  const company = requireActiveCompany(activeCompany);
  return { ...filters, company_id: company.id };
}

export function companyPayload(activeCompany, payload = {}) {
  const company = requireActiveCompany(activeCompany);
  return {
    ...payload,
    company_id: company.id,
    company_nama: company.nama,
  };
}

export function assertCompanyOwnership(activeCompany, record) {
  const company = requireActiveCompany(activeCompany);
  if (!record || record.company_id !== company.id) {
    throw new Error("Data tidak tersedia pada perusahaan aktif.");
  }
  return record;
}

export function companyQueryKey(resource, activeCompany, filters = {}) {
  return [resource, activeCompany?.id || "no-company", filters];
}
