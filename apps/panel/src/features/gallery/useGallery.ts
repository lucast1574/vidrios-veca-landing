import { useCallback, useEffect, useState } from "react";
import type { GalleryPage } from "@veca/content";
import { api } from "../../lib/api";
export type GalleryFilters = {
  search: string;
  sharing: string;
  tag: string;
  stage: string;
  segment: string;
  requestType: string;
};
export const emptyGalleryFilters: GalleryFilters = {
  search: "",
  sharing: "",
  tag: "",
  stage: "",
  segment: "",
  requestType: "",
};
export function useGallery(filters: GalleryFilters, page: number) {
  const [data, setData] = useState<GalleryPage | null>(null),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [revision, setRevision] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    setData(null);
    const timer = setTimeout(() => {
      const params = new URLSearchParams({ ...filters, page: String(page) });
      api<GalleryPage>(`/admin/gallery/photos?${params}`, {
        signal: controller.signal,
      })
        .then((result) => {
          if (!controller.signal.aborted) setData(result);
        })
        .catch((e) => {
          if (!controller.signal.aborted) setError((e as Error).message);
        })
        .finally(() => {
          if (!controller.signal.aborted) setLoading(false);
        });
    }, 220);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [filters, page, revision]);
  const refresh = useCallback(() => setRevision((v) => v + 1), []);
  return { data, loading, error, refresh };
}
