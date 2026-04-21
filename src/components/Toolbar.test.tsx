import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toolbar } from './Toolbar';

// Mock utility modules so tests don't depend on their implementations
vi.mock('../lib/jsonTransform', () => ({
  format: vi.fn((raw: string) => `formatted:${raw}`),
  minify: vi.fn((raw: string) => `minified:${raw}`),
  repair: vi.fn((raw: string) => `repaired:${raw}`),
  isValidJson: vi.fn(() => false),
}));

vi.mock('../lib/clipboard', () => ({
  writeToClipboard: vi.fn().mockResolvedValue(true),
}));

import { format, minify, repair, isValidJson } from '../lib/jsonTransform';
import { writeToClipboard } from '../lib/clipboard';

// Build a mock editorRef that simulates a live CodeMirror view
function makeMockEditorRef(docContent = '{"a":1}') {
  const dispatch = vi.fn();
  const toString = vi.fn(() => docContent);
  return {
    current: {
      view: {
        state: {
          doc: {
            toString,
            length: docContent.length,
          },
        },
        dispatch,
      },
    },
    dispatch,
    toString,
  };
}

function renderToolbar(
  props: Partial<Parameters<typeof Toolbar>[0]> & {
    editorRef?: ReturnType<typeof makeMockEditorRef>;
  } = {},
) {
  const mockRef = props.editorRef ?? makeMockEditorRef();
  const defaults = {
    editorRef: mockRef as Parameters<typeof Toolbar>[0]['editorRef'],
    rawJson: '{"a":1}',
    setRawJson: vi.fn(),
    activeTab: 'editor' as const,
  };
  const merged = { ...defaults, ...props, editorRef: mockRef as Parameters<typeof Toolbar>[0]['editorRef'] };
  const result = render(
    <TooltipProvider>
      <Toolbar {...merged} />
    </TooltipProvider>
  );
  return { ...result, mockRef };
}

describe('Toolbar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: isValidJson returns false so repair proceeds
    vi.mocked(isValidJson).mockReturnValue(false);
    vi.mocked(writeToClipboard).mockResolvedValue(true);
  });

  it('renders Open File button', () => {
    renderToolbar();
    expect(screen.getByText('Open File')).toBeInTheDocument();
  });

  it('renders Format, Minify, Repair buttons when activeTab="editor"', () => {
    renderToolbar({ activeTab: 'editor' });
    expect(screen.getByText('Format')).toBeInTheDocument();
    expect(screen.getByText('Minify')).toBeInTheDocument();
    expect(screen.getByText('Repair')).toBeInTheDocument();
  });

  it('hides Format, Minify, Repair buttons when activeTab="tree"', () => {
    renderToolbar({ activeTab: 'tree' });
    expect(screen.queryByText('Format')).not.toBeInTheDocument();
    expect(screen.queryByText('Minify')).not.toBeInTheDocument();
    expect(screen.queryByText('Repair')).not.toBeInTheDocument();
  });

  it('Format button calls view.dispatch with formatted JSON', () => {
    vi.mocked(format).mockReturnValueOnce('{"a": 1}');
    const { mockRef } = renderToolbar({ rawJson: '{"a":1}', activeTab: 'editor' });
    fireEvent.click(screen.getByText('Format'));
    expect(mockRef.dispatch).toHaveBeenCalledWith({
      changes: { from: 0, to: mockRef.current.view.state.doc.length, insert: '{"a": 1}' },
    });
  });

  it('Minify button calls view.dispatch with minified JSON', () => {
    vi.mocked(minify).mockReturnValueOnce('{"a":1}');
    const { mockRef } = renderToolbar({ rawJson: '{\n  "a": 1\n}', activeTab: 'editor' });
    fireEvent.click(screen.getByText('Minify'));
    expect(mockRef.dispatch).toHaveBeenCalledWith({
      changes: { from: 0, to: mockRef.current.view.state.doc.length, insert: '{"a":1}' },
    });
  });

  it('Repair button calls view.dispatch when JSON is invalid', () => {
    vi.mocked(isValidJson).mockReturnValue(false);
    vi.mocked(repair).mockReturnValueOnce('{"a":1}');
    const { mockRef } = renderToolbar({ rawJson: '{a:1}', activeTab: 'editor' });
    fireEvent.click(screen.getByText('Repair'));
    expect(repair).toHaveBeenCalled();
    expect(mockRef.dispatch).toHaveBeenCalledWith({
      changes: { from: 0, to: mockRef.current.view.state.doc.length, insert: '{"a":1}' },
    });
  });

  it('Repair button shows "JSON is already valid" message when JSON is valid', () => {
    vi.mocked(isValidJson).mockReturnValue(true);
    renderToolbar({ rawJson: '{"a":1}', activeTab: 'editor' });
    fireEvent.click(screen.getByText('Repair'));
    expect(screen.getByText(/JSON is already valid/)).toBeInTheDocument();
  });

  it('Copy button calls writeToClipboard', async () => {
    vi.mocked(writeToClipboard).mockResolvedValue(true);
    renderToolbar({ rawJson: '{"a":1}' });
    fireEvent.click(screen.getByText('Copy'));
    await waitFor(() => {
      expect(writeToClipboard).toHaveBeenCalled();
    });
  });

  it('Copy button shows "Copied" label after successful copy', async () => {
    vi.mocked(writeToClipboard).mockResolvedValue(true);
    renderToolbar({ rawJson: '{"a":1}' });
    fireEvent.click(screen.getByText('Copy'));
    await waitFor(() => {
      expect(screen.getByText('Copied')).toBeInTheDocument();
    });
  });

  it('Open File triggers hidden file input click', () => {
    renderToolbar();
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const clickSpy = vi.spyOn(fileInput, 'click');
    fireEvent.click(screen.getByText('Open File'));
    expect(clickSpy).toHaveBeenCalled();
  });
});
