import { useRef, useState } from 'react';
import {
  FolderOpen,
  AlignLeft,
  Minimize2,
  Wrench,
  Copy,
  type LucideIcon,
} from 'lucide-react';
import type { ReactCodeMirrorRef } from '@uiw/react-codemirror';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { format, minify, repair, isValidJson } from '../lib/jsonTransform';
import { writeToClipboard } from '../lib/clipboard';

export interface ToolbarProps {
  editorRef: React.RefObject<ReactCodeMirrorRef>;
  rawJson: string;
  setRawJson: (val: string) => void;
  activeTab: 'editor' | 'tree' | 'transform';
}

type StatusTone = 'info' | 'error' | null;

interface ToolbarButtonProps {
  icon: LucideIcon;
  label: string;
  tooltip: string;
  onClick: () => void;
  disabled?: boolean;
}

function ToolbarButton({
  icon: Icon,
  label,
  tooltip,
  onClick,
  disabled,
}: ToolbarButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClick}
            disabled={disabled}
            className="h-7 px-2 gap-1.5 text-xs text-[#d4d4d4] hover:bg-[#2d2d30] hover:text-[#d4d4d4] focus-visible:ring-1 focus-visible:ring-[#0078d4] focus-visible:outline-none disabled:opacity-40"
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </Button>
        }
      />
      <TooltipContent>{tooltip}</TooltipContent>
    </Tooltip>
  );
}

function replaceDoc(
  editorRef: React.RefObject<ReactCodeMirrorRef>,
  nextText: string,
) {
  const view = editorRef.current?.view;
  if (!view) return;
  view.dispatch({
    changes: { from: 0, to: view.state.doc.length, insert: nextText },
  });
}

function readDoc(
  editorRef: React.RefObject<ReactCodeMirrorRef>,
  fallback: string,
): string {
  return editorRef.current?.view?.state.doc.toString() ?? fallback;
}

export function Toolbar({
  editorRef,
  rawJson,
  setRawJson,
  activeTab,
}: ToolbarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [copied, setCopied] = useState(false);
  const [statusTone, setStatusTone] = useState<StatusTone>(null);
  const [statusText, setStatusText] = useState<string>('');

  function showStatus(tone: StatusTone, text: string, durationMs = 2500) {
    setStatusTone(tone);
    setStatusText(text);
    if (tone !== null) {
      window.setTimeout(() => {
        setStatusTone(null);
        setStatusText('');
      }, durationMs);
    }
  }

  // EDIT-02: Open File
  function handleOpenFile() {
    fileInputRef.current?.click();
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = (ev.target?.result as string) ?? '';
      // Sync through AppShell's setter — this is the only way to replace
      // the CodeMirror buffer when the editor is unmounted (e.g., user on Tree tab).
      setRawJson(text);
      // Also dispatch into the live view if mounted (Editor tab) so the cursor resets.
      if (editorRef.current?.view) {
        replaceDoc(editorRef, text);
      }
      // Reset input so selecting the same file re-fires change
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.onerror = () => {
      showStatus(
        'error',
        'Could not read file. Make sure it is a valid text file and try again.',
        4000,
      );
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  }

  // EDIT-04: Format
  function handleFormat() {
    const raw = readDoc(editorRef, rawJson);
    try {
      replaceDoc(editorRef, format(raw));
    } catch {
      // Invalid JSON — leave content unchanged; lint squiggles already show the error.
    }
  }

  // EDIT-05: Minify
  function handleMinify() {
    const raw = readDoc(editorRef, rawJson);
    try {
      replaceDoc(editorRef, minify(raw));
    } catch {
      // Invalid JSON — no-op.
    }
  }

  // EDIT-06: Repair
  function handleRepair() {
    const raw = readDoc(editorRef, rawJson);
    if (isValidJson(raw)) {
      showStatus('info', 'JSON is already valid — nothing to repair.');
      return;
    }
    try {
      replaceDoc(editorRef, repair(raw));
    } catch {
      showStatus('error', 'Could not repair JSON — input is too malformed.', 4000);
    }
  }

  // EDIT-07: Copy
  async function handleCopy() {
    const text = readDoc(editorRef, rawJson);
    const ok = await writeToClipboard(text);
    if (ok) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } else {
      showStatus('error', 'Could not copy to clipboard.', 3000);
    }
  }

  const showTransforms = activeTab === 'editor';

  return (
    <div
      data-testid="toolbar"
      className="flex items-center h-9 px-2 gap-1 bg-[#252526] border-b border-[#3e3e42] shrink-0"
    >
      {/* Group 1: File */}
      <ToolbarButton
        icon={FolderOpen}
        label="Open File"
        tooltip="Load JSON from disk"
        onClick={handleOpenFile}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json,text/plain"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Group 2: Transforms — editor tab only */}
      {showTransforms && (
        <>
          <Separator orientation="vertical" className="h-5 mx-1 bg-[#3e3e42]" />
          <ToolbarButton
            icon={AlignLeft}
            label="Format"
            tooltip="Pretty-print JSON (Shift+Alt+F)"
            onClick={handleFormat}
          />
          <ToolbarButton
            icon={Minimize2}
            label="Minify"
            tooltip="Collapse to single line"
            onClick={handleMinify}
          />
          <ToolbarButton
            icon={Wrench}
            label="Repair"
            tooltip="Auto-fix malformed JSON"
            onClick={handleRepair}
          />
        </>
      )}

      {/* Group 3: Copy */}
      <Separator orientation="vertical" className="h-5 mx-1 bg-[#3e3e42]" />
      <ToolbarButton
        icon={Copy}
        label={copied ? 'Copied' : 'Copy'}
        tooltip="Copy to clipboard"
        onClick={handleCopy}
      />

      {/* Inline status (repair / file-error messages) */}
      {statusTone !== null && (
        <span
          className={`ml-3 text-[11px] ${
            statusTone === 'error' ? 'text-[#f44747]' : 'text-[#858585]'
          }`}
        >
          {statusText}
        </span>
      )}
    </div>
  );
}
