import { useAuthContext } from "@/modules/auth/components/AuthProvider.jsx";
import { ROLE_PERMISSIONS, ROLES } from "@/config/permissions";

/**
 * Custom hook untuk mengecek apakah user saat ini memiliki akses spesifik.
 * @returns {Object} { hasPermission, checkAnyPermission, checkAllPermissions, role }
 */
export default function usePermissions() {
  const { role } = useAuthContext();
  
  // Default fallback jika role tidak terbaca, treat as GUEST
  const currentRole = role || ROLES.GUEST;
  
  // Ambil list permissions untuk role spesifik dari konfigurasi
  const userPermissions = ROLE_PERMISSIONS[currentRole] || [];

  /**
   * Cek satu permission pasti
   * @param {string} permissionName - Nama permission dari dict PERMISSIONS
   * @returns {boolean}
   */
  const hasPermission = (permissionName) => {
    return userPermissions.includes(permissionName);
  };

  /**
   * Mengembalikan true jika user memiliki MINIMAL SALAH SATU permission dari array
   * @param {string[]} permissionsArray 
   */
  const checkAnyPermission = (permissionsArray) => {
    return permissionsArray.some((perm) => hasPermission(perm));
  };

  /**
   * Mengembalikan true hanya jika user memiliki SEMUA permission di array
   * @param {string[]} permissionsArray 
   */
  const checkAllPermissions = (permissionsArray) => {
    return permissionsArray.every((perm) => hasPermission(perm));
  };

  return {
    role: currentRole,
    hasPermission,
    checkAnyPermission,
    checkAllPermissions,
  };
}
