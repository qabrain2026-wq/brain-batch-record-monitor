"use client";

import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("brain_theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initialDark = saved ? saved === "dark" : prefersDark;
    setDark(initialDark);
    document.documentElement.setAttribute("data-theme", initialDark ? "dark" : "light");
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.setAttribute("data-theme", next ? "dark" : "light");
    localStorage.setItem("brain_theme", next ? "dark" : "light");
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="다크·라이트 전환"
      className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--line)] text-[var(--text-secondary)] transition hover:border-[var(--navy)] hover:text-[var(--navy)]"
    >
      {dark ? "☀" : "🌙"}
    </button>
  );
}
