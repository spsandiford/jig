import { useMemo } from 'react';
import CodeMirror, { type ReactCodeMirrorRef } from '@uiw/react-codemirror';
import { json, jsonParseLinter } from '@codemirror/lang-json';
import { linter, lintGutter } from '@codemirror/lint';
import type { Extension } from '@codemirror/state';
import { vscodeDark } from '@uiw/codemirror-theme-vscode';
import { ParseErrorBanner } from './ParseErrorBanner';

export interface ComparePaneEditorProps {
  value: string;
  onChange: (val: string) => void;
  editorRef: React.RefObject<ReactCodeMirrorRef>;
  readOnly: boolean;
  extraExtensions: Extension[];   // Plan 03 passes [diffDecorationsField, diffTheme] here
  parseError: string | null;
  testId: 'compare-pane-left' | 'compare-pane-right';
}

export function ComparePaneEditor({
  value,
  onChange,
  editorRef,
  readOnly,
  extraExtensions,
  parseError,
  testId,
}: ComparePaneEditorProps) {
  const extensions = useMemo(
    () => [json(), linter(jsonParseLinter()), lintGutter(), ...extraExtensions],
    [extraExtensions],
  );

  return (
    <div data-testid={testId} className="flex flex-col flex-1 overflow-hidden bg-[#1e1e1e]">
      {parseError && <ParseErrorBanner message={parseError} />}
      <div className="flex-1 overflow-hidden">
        <CodeMirror
          ref={editorRef}
          value={value}
          theme={vscodeDark}
          extensions={extensions}
          onChange={onChange}
          readOnly={readOnly}
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
      </div>
    </div>
  );
}
