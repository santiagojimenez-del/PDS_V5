import { useTheme } from "@/components/providers/theme-provider";
import { Button } from "@/components/ui/button";
import { IconSun, IconMoon, IconDeviceDesktop } from "@tabler/icons-react";

interface ThemeToggleProps {
  variant?: "buttons" | "dropdown";
  className?: string;
}

export function ThemeToggle({ variant = "buttons", className }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();

  if (variant === "buttons") {
    return (
      <div className={className}>
        <div className="flex gap-2">
          <Button
            variant={theme === "light" ? "default" : "outline"}
            size="sm"
            onClick={() => setTheme("light")}
            className="flex items-center gap-2"
          >
            <IconSun className="h-4 w-4" />
            Light
          </Button>
          <Button
            variant={theme === "dark" ? "default" : "outline"}
            size="sm"
            onClick={() => setTheme("dark")}
            className="flex items-center gap-2"
          >
            <IconMoon className="h-4 w-4" />
            Dark
          </Button>
          <Button
            variant={theme === "system" ? "default" : "outline"}
            size="sm"
            onClick={() => setTheme("system")}
            className="flex items-center gap-2"
          >
            <IconDeviceDesktop className="h-4 w-4" />
            System
          </Button>
        </div>
      </div>
    );
  }

  // Dropdown variant (icon only toggle)
  return (
    <div className={className}>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => {
          const themes = ["light", "dark", "system"] as const;
          const currentIndex = themes.indexOf(theme as typeof themes[number]);
          const nextTheme = themes[(currentIndex + 1) % themes.length];
          setTheme(nextTheme);
        }}
        title={`Current theme: ${theme}. Click to cycle.`}
      >
        {theme === "light" && <IconSun className="h-5 w-5" />}
        {theme === "dark" && <IconMoon className="h-5 w-5" />}
        {theme === "system" && <IconDeviceDesktop className="h-5 w-5" />}
      </Button>
    </div>
  );
}
