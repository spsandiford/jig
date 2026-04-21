/**
 * Write text to the clipboard. Primary path: navigator.clipboard.writeText
 * (requires secure context — HTTPS or localhost). Fallback: document.execCommand('copy')
 * via a temporary textarea, for HTTP contexts or Firefox private mode.
 * Returns true on success, false on total failure.
 */
export async function writeToClipboard(text: string): Promise<boolean> {
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    throw new Error('Clipboard API unavailable');
  } catch {
    // Fallback: temporary textarea + execCommand
    let el: HTMLTextAreaElement | null = null;
    try {
      el = document.createElement('textarea');
      el.value = text;
      el.setAttribute('readonly', '');
      el.style.position = 'fixed';
      el.style.top = '0';
      el.style.left = '-9999px';
      el.style.opacity = '0';
      document.body.appendChild(el);
      el.focus();
      el.select();
      // execCommand is deprecated but remains the only fallback across HTTP / private modes
      const ok = document.execCommand('copy');
      return ok;
    } catch {
      return false;
    } finally {
      if (el && el.parentNode) el.parentNode.removeChild(el);
    }
  }
}
