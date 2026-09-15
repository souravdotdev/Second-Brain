import type { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
}

export function Button({ children, ...props }: ButtonProps) {
  return (
    <button
      {...props}
      style={{
        padding: "0.5rem 1rem",
        borderRadius: 6,
        border: "1px solid #ccc",
        cursor: "pointer",
        ...props.style,
      }}
    >
      {children}
    </button>
  );
}
