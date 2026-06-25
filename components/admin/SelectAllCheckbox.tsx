"use client";

export function SelectAllCheckbox() {
  return (
    <input
      type="checkbox"
      aria-label="Select all products"
      className="h-4 w-4"
      onChange={(e) => {
        const form = e.currentTarget.closest("form");
        form
          ?.querySelectorAll<HTMLInputElement>("input[name=selectedIds]")
          .forEach((cb) => {
            cb.checked = e.currentTarget.checked;
          });
      }}
    />
  );
}
