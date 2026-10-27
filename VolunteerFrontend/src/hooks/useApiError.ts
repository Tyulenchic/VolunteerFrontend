import { useState } from "react";
import { mapApiError } from "../utils/apiError";

export function useApiError() {
  const [error, setError] = useState<string | undefined>();
  const capture = (err: unknown): void => setError(mapApiError(err));
  return { error, setError, capture };
}
