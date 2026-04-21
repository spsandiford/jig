import type { ReactCodeMirrorRef } from '@uiw/react-codemirror';

export interface ToolbarProps {
  editorRef: React.RefObject<ReactCodeMirrorRef>;
  rawJson: string;
  setRawJson: (val: string) => void;
  activeTab: 'editor' | 'tree' | 'transform';
}

// Stub — Plan 02 replaces this body with full Open/Format/Minify/Repair/Copy actions.
// Intentionally references props in a no-op way so the unused-vars lint is satisfied.
export function Toolbar({ editorRef, rawJson, setRawJson, activeTab }: ToolbarProps) {
  void editorRef;
  void rawJson;
  void setRawJson;
  void activeTab;
  return (
    <div
      data-testid="toolbar-stub"
      className="flex items-center h-9 px-2 gap-1 bg-[#252526] border-b border-[#3e3e42] shrink-0"
    >
      <span className="text-xs text-[#858585]">Toolbar (stub)</span>
    </div>
  );
}
