"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { resolvedTheme, setTheme, theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <Button
        aria-label="Change theme"
        className="size-9"
        size="icon"
        variant="ghost"
      >
        <Monitor className="size-4" />
      </Button>
    );
  }

  const nextTheme = theme === "light" ? "dark" : theme === "dark" ? "system" : "light";
  const Icon = resolvedTheme === "dark" ? Moon : resolvedTheme === "light" ? Sun : Monitor;

  return (
    <Button
      aria-label={`Switch theme (current: ${theme ?? "system"})`}
      className="size-9"
      onClick={() => setTheme(nextTheme)}
      size="icon"
      variant="ghost"
    >
      <Icon className="size-4" />
    </Button>
  );
}
