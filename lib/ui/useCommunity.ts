"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect } from "react";
import { COMMUNITY_STORAGE_KEY, DEFAULT_COMMUNITY, isCommunitySlug, type CommunitySlug } from "./communities";

function readStored(): CommunitySlug | null {
  try {
    const v = window.localStorage.getItem(COMMUNITY_STORAGE_KEY);
    return isCommunitySlug(v) ? v : null;
  } catch {
    return null;
  }
}

/**
 * Selected community: `?community=` in the URL wins, then localStorage, then
 * the default. Changing it rewrites the URL (shareable) and remembers it.
 * Must be used inside a <Suspense> boundary (useSearchParams).
 */
export function useCommunity(): [CommunitySlug, (slug: CommunitySlug) => void] {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const fromUrl = params.get("community");
  const community: CommunitySlug = isCommunitySlug(fromUrl) ? fromUrl : DEFAULT_COMMUNITY;

  // On first load without ?community=, restore the remembered one.
  useEffect(() => {
    if (isCommunitySlug(fromUrl)) {
      try {
        window.localStorage.setItem(COMMUNITY_STORAGE_KEY, fromUrl);
      } catch {}
      return;
    }
    const stored = readStored();
    if (stored && stored !== DEFAULT_COMMUNITY) {
      const next = new URLSearchParams(params.toString());
      next.set("community", stored);
      router.replace(`${pathname}?${next.toString()}`, { scroll: false });
    }
  }, [fromUrl, params, pathname, router]);

  const setCommunity = useCallback(
    (slug: CommunitySlug) => {
      try {
        window.localStorage.setItem(COMMUNITY_STORAGE_KEY, slug);
      } catch {}
      const next = new URLSearchParams(params.toString());
      next.set("community", slug);
      next.delete("id");
      router.replace(`${pathname}?${next.toString()}`, { scroll: false });
    },
    [params, pathname, router]
  );

  return [community, setCommunity];
}
