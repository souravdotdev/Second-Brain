import type { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
}

export function Card({ children }: CardProps) {
  return (
    <div
      style={{
        padding: "1rem",
        borderRadius: 8,
        border: "1px solid #e5e5e5",
      }}
    >
      {children}
    </div>
  );
}
