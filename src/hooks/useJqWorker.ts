import { useEffect, useRef, useState, useCallback } from 'react';
import JqWorker from '../workers/jqWorker.ts?worker';

type WorkerMessage =
  | { type: 'ready' }
  | { type: 'result'; output: string }
  | { type: 'error'; message: string };

export interface UseJqWorkerReturn {
  engineReady: boolean;
  running: boolean;
  output: string | null;
  error: string | null;
  run: (expr: string, json: string) => void;
}

export function useJqWorker(): UseJqWorkerReturn {
  const workerRef = useRef<Worker | null>(null);
  const [engineReady, setEngineReady] = useState(false);
  const [running, setRunning] = useState(false);
  const [output, setOutput] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const worker = new JqWorker();
    workerRef.current = worker;

    worker.onmessage = (e: MessageEvent<WorkerMessage>) => {
      const msg = e.data;
      if (msg.type === 'ready') {
        setEngineReady(true);
      } else if (msg.type === 'result') {
        setOutput(msg.output);
        setError(null);
        setRunning(false);
      } else if (msg.type === 'error') {
        setError(msg.message);
        setOutput(null);
        setRunning(false);
      }
    };

    return () => {
      worker.terminate();
      workerRef.current = null;
    };
  }, []);

  const run = useCallback((expr: string, json: string) => {
    if (!workerRef.current || !engineReady || running) return;
    setRunning(true);
    setOutput(null);
    setError(null);
    workerRef.current.postMessage({ type: 'run', expr, json });
  }, [engineReady, running]);

  return { engineReady, running, output, error, run };
}
