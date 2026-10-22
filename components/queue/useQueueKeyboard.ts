"use client";

import { useEffect } from "react";
import type { Decision } from "./types";

type Handlers = {
  onMove: (delta: number) => void;
  onDecide: (d: Decision) => void;
  onFocusReply: () => void;
  onSend: () => void;
  onUndo: () => void;
  onHelp: () => void;
  onReload: () => void;
  enabled: boolean;
};

function isTypingTarget(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  const tag = el.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  return el.isContentEditable;
}

export function useQueueKeyboard(handlers: Handlers) {
  useEffect(() => {
    if (!handlers.enabled) return;

    function onKeyDown(e: KeyboardEvent) {
      const typing = isTypingTarget(e.target);

      if (e.key === "Escape") {
        if (typing && e.target instanceof HTMLElement) {
          e.target.blur();
        }
        return;
      }

      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        handlers.onSend();
        return;
      }

      if (typing) return;

      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;

      if (key === "j") {
        e.preventDefault();
        handlers.onMove(1);
      } else if (key === "k") {
        e.preventDefault();
        handlers.onMove(-1);
      } else if (key === "a") {
        e.preventDefault();
        handlers.onDecide("accept");
      } else if (key === "s") {
        e.preventDefault();
        handlers.onDecide("ask");
      } else if (key === "d") {
        e.preventDefault();
        handlers.onDecide("decline");
      } else if (key === "e") {
        e.preventDefault();
        handlers.onFocusReply();
      } else if (key === "Enter") {
        e.preventDefault();
        handlers.onSend();
      } else if (key === "z") {
        e.preventDefault();
        handlers.onUndo();
      } else if (key === "?" || (e.shiftKey && key === "/")) {
        e.preventDefault();
        handlers.onHelp();
      } else if (key === "r") {
        e.preventDefault();
        handlers.onReload();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handlers]);
}
