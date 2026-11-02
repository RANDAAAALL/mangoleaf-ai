import type { ComponentProps } from "react";

/** Shared backup actions retain their 48px tap target and translated caller-supplied labels. */
export function BackupActionButton({
  tone = "secondary",
  type = "button",
  className = "",
  ...props
}: ComponentProps<"button"> & { tone?: "primary" | "secondary" }) {
  const color =
    tone === "primary"
      ? "bg-[#277839] px-5 text-white"
      : "border border-[#277839] px-4 text-[#246b34]";
  return (
    <button
      {...props}
      type={type}
      className={`min-h-12 rounded-full py-3 text-sm font-bold disabled:opacity-50 ${color} ${className}`}
    />
  );
}
