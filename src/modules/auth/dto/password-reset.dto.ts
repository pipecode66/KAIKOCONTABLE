export type PasswordResetActionState = {
  success: boolean;
  message: string;
  fieldErrors?: Record<string, string[] | undefined>;
  debugResetUrl?: string;
};
