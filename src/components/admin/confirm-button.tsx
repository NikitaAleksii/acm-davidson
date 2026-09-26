"use client";

import type { ComponentProps } from "react";

/** Submit button that asks for confirmation first. Use inside a <form action={serverAction}>. */
export function ConfirmButton({
  message,
  onClick,
  ...props
}: ComponentProps<"button"> & { message: string }) {
  return (
    <button
      type="submit"
      onClick={(e) => {
        if (!window.confirm(message)) {
          e.preventDefault();
          return;
        }
        onClick?.(e);
      }}
      {...props}
    />
  );
}
