import { cookies } from "next/headers";

export const VIEW_MODE_COOKIE = "view_mode";

export default function ViewModeToggle() {
  const mode = cookies().get(VIEW_MODE_COOKIE)?.value === "qa" ? "qa" : "writer";

  return (
    <div className="flex items-center rounded-full border border-[var(--line)] bg-[var(--card)] p-0.5 text-sm shadow-md">
      <ModeButton mode="writer" active={mode === "writer"} label="작성자용" />
      <ModeButton mode="qa" active={mode === "qa"} label="QA용" />
    </div>
  );
}

function ModeButton({ mode, active, label }: { mode: "writer" | "qa"; active: boolean; label: string }) {
  return (
    <form action="/api/view-mode" method="post">
      <input type="hidden" name="mode" value={mode} />
      <button
        type="submit"
        className={`rounded-full px-3 py-1.5 font-medium transition ${
          active ? "bg-brand-600 text-white" : "text-[var(--text-secondary)]"
        }`}
      >
        {label}
      </button>
    </form>
  );
}
