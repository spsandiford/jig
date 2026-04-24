import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TooltipProvider } from '@/components/ui/tooltip';

const runSpy = vi.fn();
const useJqWorkerMock = vi.fn();
const useJsonDocumentMock = vi.fn();

vi.mock('../hooks/useJqWorker', () => ({
  useJqWorker: (...args: unknown[]) => useJqWorkerMock(...args),
}));
vi.mock('../hooks/useJsonDocument', () => ({
  useJsonDocument: (...args: unknown[]) => useJsonDocumentMock(...args),
}));

import { TransformPanel } from './TransformPanel';

function renderPanel(props = {}) {
  return render(<TooltipProvider><TransformPanel {...props} /></TooltipProvider>);
}

beforeEach(() => {
  runSpy.mockReset();
  useJqWorkerMock.mockReset();
  useJsonDocumentMock.mockReset();
  useJsonDocumentMock.mockReturnValue({ rawJson: '{"a":1}', setRawJson: vi.fn(), onChange: vi.fn() });
});

describe('TransformPanel', () => {
  // Test 1 (XFRM-02): When engineReady is false, OutputPane shows the engine-loading hint text
  it('shows engine-loading hint in OutputPane when engineReady is false', () => {
    useJqWorkerMock.mockReturnValue({ engineReady: false, running: false, output: null, error: null, run: runSpy });
    renderPanel();
    expect(screen.getByTestId('output-pane').textContent).toContain('jq engine loading');
  });

  // Test 2 (XFRM-02): When engineReady is false, RunButton is disabled and shows Loading…
  it('disables RunButton and shows "Loading…" when engineReady is false', () => {
    useJqWorkerMock.mockReturnValue({ engineReady: false, running: false, output: null, error: null, run: runSpy });
    renderPanel();
    const btn = screen.getByTestId('run-button');
    expect(btn).toBeDisabled();
    expect(btn.textContent).toContain('Loading');
  });

  // Test 3 (XFRM-01): Clicking Run calls run(expr, rawJson) with correct args
  it('calls run(expr, rawJson) when Run button is clicked', () => {
    useJqWorkerMock.mockReturnValue({ engineReady: true, running: false, output: null, error: null, run: runSpy });
    renderPanel();
    fireEvent.change(screen.getByTestId('expression-input'), { target: { value: '.a' } });
    fireEvent.click(screen.getByTestId('run-button'));
    expect(runSpy).toHaveBeenCalledWith('.a', '{"a":1}');
  });

  // Test 4 (XFRM-01): Ctrl+Enter triggers run with the same arguments
  it('calls run(expr, rawJson) when Ctrl+Enter pressed in expression input', () => {
    useJqWorkerMock.mockReturnValue({ engineReady: true, running: false, output: null, error: null, run: runSpy });
    renderPanel();
    fireEvent.change(screen.getByTestId('expression-input'), { target: { value: '.' } });
    fireEvent.keyDown(screen.getByTestId('expression-input'), { key: 'Enter', ctrlKey: true });
    expect(runSpy).toHaveBeenCalledWith('.', '{"a":1}');
  });

  // Test 5 (XFRM-01): RunButton disabled when expression is empty even if engineReady
  it('disables RunButton when expression is empty even if engineReady and not running', () => {
    useJqWorkerMock.mockReturnValue({ engineReady: true, running: false, output: null, error: null, run: runSpy });
    renderPanel();
    expect(screen.getByTestId('run-button')).toBeDisabled();
  });

  // Test 6 (XFRM-03 + D-04): Error state shows ErrorBanner with message, no output pre
  it('shows ErrorBanner with error message when error is set', () => {
    useJqWorkerMock.mockReturnValue({ engineReady: true, running: false, output: null, error: 'compile error near .foo', run: runSpy });
    renderPanel();
    expect(screen.getByTestId('error-banner').textContent).toContain('Expression error');
    expect(screen.getByTestId('error-banner').textContent).toContain('compile error near .foo');
    expect(screen.queryByText('No output yet')).toBeNull();
  });

  // Test 7 (D-04): Prior successful output not retained when error occurs
  it('does not retain prior output when transitioning to error state', () => {
    useJqWorkerMock.mockReturnValue({ engineReady: true, running: false, output: '"hello"', error: null, run: runSpy });
    const { rerender } = render(
      <TooltipProvider>
        <TransformPanel />
      </TooltipProvider>
    );
    useJqWorkerMock.mockReturnValue({ engineReady: true, running: false, output: null, error: 'bad filter', run: runSpy });
    rerender(
      <TooltipProvider>
        <TransformPanel />
      </TooltipProvider>
    );
    expect(screen.queryByText('"hello"')).toBeNull();
  });

  // Test 8 (XFRM-01 pretty-print): Valid JSON output is pretty-printed
  it('pretty-prints valid JSON output with 2-space indent', () => {
    useJqWorkerMock.mockReturnValue({ engineReady: true, running: false, output: '{"a":1}', error: null, run: runSpy });
    renderPanel();
    expect(screen.getByTestId('output-pane').textContent).toContain('"a": 1');
  });

  // Test 9 (Running): RunButton disabled and shows spinner when running is true
  it('disables RunButton and shows spinner when running is true', () => {
    useJqWorkerMock.mockReturnValue({ engineReady: true, running: true, output: null, error: null, run: runSpy });
    renderPanel();
    // Type an expression so hasExpression is true
    fireEvent.change(screen.getByTestId('expression-input'), { target: { value: '.' } });
    const btn = screen.getByTestId('run-button');
    expect(btn).toBeDisabled();
    expect(btn.querySelector('.animate-spin')).not.toBeNull();
  });

  // Test 10 (onOutputChange): callback called on output transitions
  it('calls onOutputChange callback with each new output value', () => {
    const onOutputChange = vi.fn();
    useJqWorkerMock.mockReturnValue({ engineReady: true, running: false, output: '"hello"', error: null, run: runSpy });
    const { rerender } = render(
      <TooltipProvider>
        <TransformPanel onOutputChange={onOutputChange} />
      </TooltipProvider>
    );
    useJqWorkerMock.mockReturnValue({ engineReady: true, running: false, output: null, error: null, run: runSpy });
    rerender(
      <TooltipProvider>
        <TransformPanel onOutputChange={onOutputChange} />
      </TooltipProvider>
    );
    expect(onOutputChange).toHaveBeenCalledWith('"hello"');
    expect(onOutputChange).toHaveBeenCalledWith(null);
  });
});
