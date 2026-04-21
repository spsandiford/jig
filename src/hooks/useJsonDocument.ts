import { useCallback, useState } from 'react';

export function useJsonDocument(initialValue = '') {
  const [rawJson, setRawJson] = useState<string>(initialValue);
  const onChange = useCallback((val: string) => setRawJson(val), []);
  return { rawJson, setRawJson, onChange };
}
