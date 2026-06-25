"use client";

import type { ReactNode, MouseEvent } from "react";

export function ConfirmSubmitButton({
  children,
  confirmMessage,
  className,
  disabled,
  title,
}: {
  children: ReactNode;
  confirmMessage: string;
  className?: string;
  disabled?: boolean;
  title?: string;
}) {
  function handleClick(event: MouseEvent<HTMLButtonElement>) {
    if (!window.confirm(confirmMessage)) {
      event.preventDefault();
    }
  }

  return (
    <button
      type="submit"
      onClick={handleClick}
      disabled={disabled}
      title={title}
      className={`${className ?? ""} disabled:cursor-not-allowed disabled:opacity-40`}
    >
      {children}
    </button>
  );
}
