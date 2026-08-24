export class UserInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UserInputError";
  }
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function parseRegistrationInput(value: unknown) {
  if (!value || typeof value !== "object") throw new UserInputError("البيانات المرسلة غير صالحة");
  const item = value as Record<string, unknown>;
  const name = typeof item.name === "string" ? item.name.trim() : "";
  const email = typeof item.email === "string" ? item.email.trim() : "";
  const password = typeof item.password === "string" ? item.password : "";
  const confirmation = typeof item.passwordConfirmation === "string" ? item.passwordConfirmation : "";
  if (name.length < 2 || name.length > 120) throw new UserInputError("الاسم مطلوب ويجب أن يكون بين حرفين و120 حرفًا");
  if (!EMAIL_PATTERN.test(email) || email.length > 320) throw new UserInputError("أدخل بريدًا إلكترونيًا صالحًا");
  if (!/^(?=.*[A-Za-z])(?=.*\d).{10,200}$/.test(password)) throw new UserInputError("كلمة المرور يجب أن تكون 10 أحرف على الأقل وتحتوي على حرف ورقم");
  if (password !== confirmation) throw new UserInputError("تأكيد كلمة المرور غير مطابق");
  return { name, email, password };
}

export function parseLoginInput(value: unknown) {
  if (!value || typeof value !== "object") throw new UserInputError("البيانات المرسلة غير صالحة");
  const item = value as Record<string, unknown>;
  const email = typeof item.email === "string" ? item.email.trim() : "";
  const password = typeof item.password === "string" ? item.password : "";
  if (!EMAIL_PATTERN.test(email) || email.length > 320 || !password) throw new UserInputError("البريد الإلكتروني أو كلمة المرور غير صالحين");
  return { email, password };
}
