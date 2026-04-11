import type { SelectOption } from "@/lib/types/api";

export type DropdownSource = "vaccine" | "test" | "dehel" | "ecto";

/** Test panel definition matching PHP addtest.php */
export interface TestPanel {
  id: string;
  label: string;
  /** DB column this result maps to */
  field: string;
  /** Sub-tests (for grouped panels like Caniv4) */
  subtests?: { label: string; field: string }[];
}

/** PHP test panels — exact match to addtest.php */
export const TEST_PANELS: TestPanel[] = [
  { id: "leishmania", label: "Leishmania", field: "vacn" },
  { id: "babesia", label: "Canine Babesia", field: "deh" },
  { id: "giardia", label: "GiarDia duodenalis", field: "vac1" },
  { id: "distemper", label: "Canine distemper", field: "vac2" },
  {
    id: "caniv4",
    label: "Caniv4",
    field: "",
    subtests: [
      { label: "Heartworm", field: "vac3" },
      { label: "Lyim", field: "vac4" },
      { label: "Anaplazma", field: "vac5" },
      { label: "E.Canis", field: "vac6" },
    ],
  },
  {
    id: "cpv_ccov",
    label: "CPV/CCov/Giardia",
    field: "",
    subtests: [
      { label: "CPV", field: "vac7" },
      { label: "CCov", field: "vac8" },
      { label: "Giardia", field: "vac9" },
    ],
  },
  { id: "erlichia", label: "Erlichia Canis", field: "ser" },
];

/** Ecto category definitions matching PHP addecto.php */
export interface EctoCategory {
  id: string;
  label: string;
  /** Main dropdown field (vac1, vac3, vac5, vac7) */
  selectField: string;
  /** Free-text "other" field (vac, vac2, vac4, vac6) */
  otherField: string;
  /** Which options key to use */
  optionsKey: "drops" | "tablets" | "collars" | "sprays";
}

export const ECTO_CATEGORIES: EctoCategory[] = [
  { id: "drops", label: "ანტიპარაზიტული წვეთები", selectField: "vac1", otherField: "vac", optionsKey: "drops" },
  { id: "pills", label: "ანტიპარაზიტული აბები", selectField: "vac3", otherField: "vac2", optionsKey: "tablets" },
  { id: "collar", label: "ანტიპარაზიტული საყელო", selectField: "vac5", otherField: "vac4", optionsKey: "collars" },
  { id: "spray", label: "ანტიპარაზიტული სპრეი", selectField: "vac7", otherField: "vac6", optionsKey: "sprays" },
];

export interface FieldConfig {
  /** Which dropdown data source to use for the main 'vac' field */
  dropdownSource?: DropdownSource;
  /** Whether this type has a secondary brand/name dropdown (vacn) */
  hasVacn?: boolean;
  /** Whether this type has a serial/batch number field (ser) */
  hasSer?: boolean;
  /** Whether this type has a next-due date (date2) */
  hasDate2?: boolean;
  /** Whether this type has test result panels */
  hasTestPanels?: boolean;
  /** Whether this type has treatment field (nout) */
  hasNout?: boolean;
  /** Whether this type has prescription field (dani) */
  hasDani?: boolean;
  /** Whether this type has owner-visible comment (coment) */
  hasComent?: boolean;
  /** Whether this type uses ecto sub-categories */
  ectoCategories?: boolean;
  /** Whether dehel uses 'deh' field for drug dropdown */
  hasDeh?: boolean;
  /** Required fields beyond 'tp' */
  requiredFields?: string[];
}

/**
 * Centralized config: procedure type ID -> which fields to render.
 *
 * Type IDs from backend ProcedureTypeItem:
 * 1=Vaccination, 101=Rabies, 2=Test, 3=Dehel, 4=Ecto, 5+=generic
 */
export const PROCEDURE_FIELD_CONFIG: Record<number, FieldConfig> = {
  // Vaccination
  1: {
    dropdownSource: "vaccine",
    hasVacn: true,
    hasSer: true,
    hasDate2: true,
    hasComent: true,
    requiredFields: ["vac"],
  },
  // Rabies vaccination
  101: {
    dropdownSource: "vaccine",
    hasVacn: true,
    hasSer: true,
    hasDate2: true,
    hasComent: true,
    requiredFields: ["vac"],
  },
  // Test
  2: {
    hasTestPanels: true,
    hasComent: true,
    hasDani: true,
    requiredFields: [],
  },
  // Dehelminization
  3: {
    dropdownSource: "dehel",
    hasDeh: true,
    hasDate2: true,
    hasComent: true,
    requiredFields: [],
  },
  // Ectoparasite
  4: {
    ectoCategories: true,
    hasDate2: true,
    hasComent: true,
    requiredFields: [],
  },
  // Consultation (108)
  108: {
    hasNout: true,
    hasDani: true,
    hasComent: true,
    requiredFields: [],
  },
};

const DEFAULT_CONFIG: FieldConfig = {
  hasNout: true,
  hasDani: true,
  hasComent: true,
  requiredFields: [],
};

export function getFieldConfig(tp: number): FieldConfig {
  return PROCEDURE_FIELD_CONFIG[tp] ?? DEFAULT_CONFIG;
}

/** Resolve dropdown options for a procedure type */
export function getDropdownOptions(
  config: FieldConfig,
  vaccineOpts?: { vaccines: SelectOption[]; brands: SelectOption[] },
  testOpts?: SelectOption[],
  dehelOpts?: SelectOption[],
  ectoOpts?: { drops: SelectOption[]; collars: SelectOption[]; tablets: SelectOption[]; sprays?: SelectOption[] },
): SelectOption[] {
  switch (config.dropdownSource) {
    case "vaccine":
      return vaccineOpts?.vaccines ?? [];
    case "test":
      return testOpts ?? [];
    case "dehel":
      return dehelOpts ?? [];
    case "ecto":
      return [
        ...(ectoOpts?.drops ?? []),
        ...(ectoOpts?.collars ?? []),
        ...(ectoOpts?.tablets ?? []),
        ...(ectoOpts?.sprays ?? []),
      ];
    default:
      return [];
  }
}

export function getBrandOptions(
  config: FieldConfig,
  vaccineOpts?: { vaccines: SelectOption[]; brands: SelectOption[] },
): SelectOption[] {
  if (config.dropdownSource === "vaccine") {
    return vaccineOpts?.brands ?? [];
  }
  return [];
}
