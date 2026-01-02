// apps/portal/src/design/PasswordInput.tsx
import * as React from "react";
import { TextInput } from "./TextInput";

interface PasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function PasswordInput(props: PasswordInputProps) {
  return <TextInput {...props} type="password" />;
}
