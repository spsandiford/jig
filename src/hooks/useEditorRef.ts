import { useRef } from 'react';
import type { ReactCodeMirrorRef } from '@uiw/react-codemirror';

export function useEditorRef() {
  return useRef<ReactCodeMirrorRef>(null);
}
