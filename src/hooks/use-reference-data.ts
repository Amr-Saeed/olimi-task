"use client";

import { useState, useEffect } from "react";
import {
  fetchLanguages,
  fetchVoices,
  fetchPrompts,
  fetchModels,
  type Language,
  type Voice,
  type Prompt,
  type Model,
} from "@/lib/api";

interface ReferenceData {
  languages: Language[];
  voices: Voice[];
  prompts: Prompt[];
  models: Model[];
}

interface UseReferenceDataReturn {
  data: ReferenceData;
  isLoading: boolean;
  error: string | null;
}

export function useReferenceData(): UseReferenceDataReturn {
  const [data, setData] = useState<ReferenceData>({
    languages: [],
    voices: [],
    prompts: [],
    models: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const MIN_LOADING_MS = 500;
      const start = Date.now();

      try {
        const [languages, voices, prompts, models] = await Promise.all([
          fetchLanguages(),
          fetchVoices(),
          fetchPrompts(),
          fetchModels(),
        ]);

        // Ensure skeleton is visible for at least MIN_LOADING_MS
        const elapsed = Date.now() - start;
        if (elapsed < MIN_LOADING_MS) {
          await new Promise((r) => setTimeout(r, MIN_LOADING_MS - elapsed));
        }

        if (!cancelled) {
          setData({ languages, voices, prompts, models });
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Failed to load form data. Please refresh the page.",
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  return { data, isLoading, error };
}
