import { useState } from "react";
import axios from "axios";

export function useApiError() {
  const [error, setError] = useState<string | undefined>();
  const capture = (err: unknown): void => {
    if (axios.isAxiosError(err)) {
      const d = err.response?.data;
      setError(typeof d === "string" ? d : d?.message ?? d?.title ?? "Произошла ошибка. Попробуйте ещё раз.");
    } else { setError("Неизвестная ошибка."); }
  };
  return { error, setError, capture };
}
