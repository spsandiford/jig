import { useMemo } from 'react';
import CodeMirror, { type ReactCodeMirrorRef } from '@uiw/react-codemirror';
import { json, jsonParseLinter } from '@codemirror/lang-json';
import { linter, lintGutter, diagnosticCount } from '@codemirror/lint';
import { EditorView } from '@codemirror/view';
import { vscodeDark } from '@uiw/codemirror-theme-vscode';

export interface CodeMirrorEditorProps {
  value: string;
  onChange: (val: string) => void;
  onErrorCountChange: (n: number) => void;
  editorRef: React.RefObject<ReactCodeMirrorRef>;
}

export function CodeMirrorEditor({
  value,
  onChange,
  onErrorCountChange,
  editorRef,
}: CodeMirrorEditorProps) {
  const extensions = useMemo(
    () => [
      json(),
      linter(jsonParseLinter()),
      lintGutter(),
      EditorView.updateListener.of((update) => {
        onErrorCountChange(diagnosticCount(update.state));
      }),
    ],
    [onErrorCountChange],
  );

  return (
    <CodeMirror
      ref={editorRef}
      value={value}
      theme={vscodeDark}
      extensions={extensions}
      onChange={onChange}
      height="100%"
      className="h-full"
      basicSetup={{
        lineNumbers: true,
        foldGutter: true,
        highlightActiveLineGutter: true,
        highlightActiveLine: true,
        searchKeymap: true,
      }}
    />
  );
}
