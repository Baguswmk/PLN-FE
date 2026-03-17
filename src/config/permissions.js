/**
 * Definisi Role di Sistem (contoh mapping dari database/Strapi)
 */
export const ROLES = {
  ADMIN: "Admin",
  PENGAWAS: "Pengawas",
  OPERATOR: "Operator",
  GUEST: "Guest",
};

/**
 * Konfigurasi dictionary permission yang spesifik.
 * Sangat maintainable, jika ada modul baru cukup tambahkan key di sini.
 */
export const PERMISSIONS = {
  // --- Modul Pengeluaran ROM ---
  VIEW_ROM: "VIEW_ROM",
  CREATE_ROM: "CREATE_ROM",
  EDIT_ROM: "EDIT_ROM",
  DELETE_ROM: "DELETE_ROM",
  EXPORT_ROM: "EXPORT_ROM",
  VIEW_ROM_ANALYTICS: "VIEW_ROM_ANALYTICS",

  // --- Modul Penerimaan SDJ ---
  VIEW_SDJ: "VIEW_SDJ",
  CREATE_SDJ: "CREATE_SDJ",
  EDIT_SDJ: "EDIT_SDJ",
  DELETE_SDJ: "DELETE_SDJ",
  EXPORT_SDJ: "EXPORT_SDJ",
  VIEW_SDJ_ANALYTICS: "VIEW_SDJ_ANALYTICS",
  
  // --- Modul Dashboard / Umum ---
  VIEW_DASHBOARD: "VIEW_DASHBOARD",
  MANAGE_USERS: "MANAGE_USERS",
};

/**
 * Mapping Role ke Array Permission.
 * Cara paling flexibel untuk mengatur apa yang bisa diakses tanpa merubah UI.
 */
export const ROLE_PERMISSIONS = {
  [ROLES.ADMIN]: [
    // Admin bisa melakukan semuanya
    Object.values(PERMISSIONS),
  ].flat(),

  [ROLES.PENGAWAS]: [
    PERMISSIONS.VIEW_DASHBOARD,
    
    PERMISSIONS.VIEW_ROM,
    PERMISSIONS.EDIT_ROM, // Pengawas mungkin bisa mengedit jika salah input
    PERMISSIONS.VIEW_ROM_ANALYTICS,
    PERMISSIONS.EXPORT_ROM,

    PERMISSIONS.VIEW_SDJ,
    PERMISSIONS.EDIT_SDJ,
    PERMISSIONS.VIEW_SDJ_ANALYTICS,
    PERMISSIONS.EXPORT_SDJ,
  ],

  [ROLES.OPERATOR]: [
    PERMISSIONS.VIEW_DASHBOARD,
    
    PERMISSIONS.VIEW_ROM,
    PERMISSIONS.CREATE_ROM, // Operator lapang hanya boleh membuat/submit data
    
    PERMISSIONS.VIEW_SDJ,
    PERMISSIONS.CREATE_SDJ,
  ],

  [ROLES.GUEST]: [
    // Guest sangat terbatas
    PERMISSIONS.VIEW_DASHBOARD,
  ],
};
