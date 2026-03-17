import React from "react";
import usePermissions from "@/hooks/usePermissions";

/**
 * Wrapper Component yang pintar untuk merender child component
 * hanya ketika user memiliki Authorization (Permission) yang tepat.
 * 
 * @param {Object} props
 * @param {string} props.permission - Permission yang spesifik harus dimiliki (e.g., "DELETE_ROM")
 * @param {string[]} [props.anyOf] - Array permission dimana salah satu saja cukup
 * @param {string[]} [props.allOf] - Array permission dimana user harus punya semuanya
 * @param {React.ReactNode} [props.fallback=null] - UI yang dimunculkan jika tidak diijinkan
 */
export default function PermissionGuard({
  permission,
  anyOf,
  allOf,
  children,
  fallback = null,
}) {
  const { hasPermission, checkAnyPermission, checkAllPermissions } = usePermissions();

  let isAllowed = false;

  if (permission) {
    isAllowed = hasPermission(permission);
  } else if (anyOf && Array.isArray(anyOf)) {
    isAllowed = checkAnyPermission(anyOf);
  } else if (allOf && Array.isArray(allOf)) {
    isAllowed = checkAllPermissions(allOf);
  }

  // Jika kondisi lolos, render children-nya, misal <ButtonHapus>
  if (isAllowed) {
    return <>{children}</>;
  }

  // Jika tidak lolos render element kosong, atau dummy disabled fallback
  return fallback ? <>{fallback}</> : null;
}
