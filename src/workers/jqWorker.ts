import jq from 'jq-web';
import { sanitizeJqError } from '../lib/jqErrors';

type RunMessage = { type: 'run'; expr: string; json: string };

jq.then((jqInst) => {
  self.postMessage({ type: 'ready' });

  self.onmessage = (e: MessageEvent<RunMessage>) => {
    if (e.data.type !== 'run') return;
    const { expr, json } = e.data;
    try {
      const result = jqInst.raw(json, expr);
      self.postMessage({ type: 'result', output: result.trim() });
    } catch (err) {
      self.postMessage({ type: 'error', message: sanitizeJqError(err) });
    }
  };
});
