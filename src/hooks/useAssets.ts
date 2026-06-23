import { useState } from "react";
import type { Asset } from "../types";

export function useAssets() {
  const [assets, setAssets] = useState<Asset[]>([]);

  const addAssets = (newAssets: Asset[]) => {
    setAssets((prev) => [...prev, ...newAssets]);
  };

  const removeAsset = (id: string) => {
    setAssets((prev) => prev.filter((a) => a.id !== id));
  };

  return { assets, addAssets, removeAsset };
}
