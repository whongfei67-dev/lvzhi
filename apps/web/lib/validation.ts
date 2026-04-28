export function calculatePasswordStrength(password: string): {
  score: number; // 0-3
  label: string;
  color: string;
  bgColor: string;
} {
  if (!password) return { score: 0, label: "", color: "", bgColor: "" };

  let score = 0;
  if (password.length >= 8) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;

  const levels = [
    { score: 0, label: "弱", color: "text-red-600", bgColor: "bg-red-500" },
    { score: 1, label: "弱", color: "text-red-600", bgColor: "bg-red-500" },
    { score: 2, label: "中", color: "text-amber-600", bgColor: "bg-amber-500" },
    { score: 3, label: "强", color: "text-emerald-600", bgColor: "bg-emerald-500" },
    { score: 4, label: "强", color: "text-emerald-600", bgColor: "bg-emerald-500" },
  ];

  return levels[score];
}

export function validateEmail(email: string): { valid: boolean; message?: string } {
  if (!email) return { valid: true };
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!re.test(email)) {
    return { valid: false, message: "邮箱格式不正确" };
  }
  return { valid: true };
}
