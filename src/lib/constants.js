export const PHONE_REGEX = /^[6-9]\d{9}$/;

// Login ke baad user ko kahan bhejna hai
export function homePathFor(role) {
  if (role === "ADMIN") return "/admin";
  if (role === "RESTAURANT") return "/dashboard";
  return "/cities";
}