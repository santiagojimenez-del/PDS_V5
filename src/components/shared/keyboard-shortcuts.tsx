"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { IconKeyboard } from "@tabler/icons-react";

interface Shortcut {
  keys: string[];
  description: string;
  action?: () => void;
}

const shortcuts: Shortcut[] = [
  {
    keys: ["Ctrl", "K"],
    description: "Open global search",
  },
  {
    keys: ["?"],
    description: "Show keyboard shortcuts",
  },
  {
    keys: ["G", "H"],
    description: "Go to home/dashboard",
  },
  {
    keys: ["G", "J"],
    description: "Go to jobs",
  },
  {
    keys: ["G", "S"],
    description: "Go to sites",
  },
  {
    keys: ["G", "T"],
    description: "Go to settings",
  },
  {
    keys: ["Esc"],
    description: "Close dialogs/modals",
  },
];

export function KeyboardShortcuts() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [keySequence, setKeySequence] = useState<string[]>([]);

  useEffect(() => {
    let sequenceTimeout: NodeJS.Timeout;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      // Show shortcuts dialog with ?
      if (e.key === "?" && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setOpen(true);
        return;
      }

      // Close with Escape
      if (e.key === "Escape") {
        setOpen(false);
        return;
      }

      // Handle "G" sequence shortcuts
      if (e.key.toLowerCase() === "g" && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setKeySequence(["g"]);

        // Clear sequence after 1 second
        clearTimeout(sequenceTimeout);
        sequenceTimeout = setTimeout(() => {
          setKeySequence([]);
        }, 1000);
        return;
      }

      // Handle second key in "G" sequence
      if (keySequence[0] === "g") {
        e.preventDefault();
        clearTimeout(sequenceTimeout);
        setKeySequence([]);

        switch (e.key.toLowerCase()) {
          case "h":
            router.push("/");
            break;
          case "j":
            router.push("/workflow/jobs");
            break;
          case "s":
            router.push("/workflow/sites");
            break;
          case "t":
            router.push("/settings");
            break;
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      clearTimeout(sequenceTimeout);
    };
  }, [router, keySequence]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <IconKeyboard className="h-5 w-5 text-primary" />
            <DialogTitle>Keyboard Shortcuts</DialogTitle>
          </div>
          <DialogDescription>
            Use these keyboard shortcuts to navigate faster
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          {shortcuts.map((shortcut, index) => (
            <div
              key={index}
              className="flex items-center justify-between rounded-lg border p-3"
            >
              <span className="text-sm text-muted-foreground">
                {shortcut.description}
              </span>
              <div className="flex items-center gap-1">
                {shortcut.keys.map((key, i) => (
                  <span key={i} className="flex items-center gap-1">
                    <kbd className="pointer-events-none inline-flex h-7 select-none items-center gap-1 rounded border bg-muted px-2 font-mono text-[12px] font-medium text-muted-foreground">
                      {key}
                    </kbd>
                    {i < shortcut.keys.length - 1 && (
                      <span className="text-muted-foreground">+</span>
                    )}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">
          <p>
            <strong>Tip:</strong> Press <kbd className="rounded bg-background px-1.5 py-0.5">?</kbd> anytime to
            see this help dialog.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
