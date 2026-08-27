"use client";

import { createContext, useContext } from "react";

const DarkScopeContext = createContext(false);

export function DarkScope({ children }: { children: React.ReactNode }) {
  return <DarkScopeContext.Provider value={true}>{children}</DarkScopeContext.Provider>;
}

/**
 * Popup/portal content (Dialog, Sheet, Select, Popover, DropdownMenu) renders
 * into document.body, escaping the `.dark` class on the admin layout wrapper.
 * Context still flows through portals, so this tells those popups to add
 * `dark` on themselves to pick up the right theme tokens.
 */
export function useDarkScope() {
  return useContext(DarkScopeContext);
}
