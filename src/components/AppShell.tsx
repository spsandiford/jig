import { useState } from 'react';
import { FileJson, GitBranch, Zap } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { CodeMirrorEditor } from './CodeMirrorEditor';
import { Toolbar } from './Toolbar';
import { TreeView } from './TreeView';
import { StatusBar } from './StatusBar';
import { TreeErrorBoundary } from './TreeErrorBoundary';
import { useJsonDocument } from '../hooks/useJsonDocument';
import { useEditorRef } from '../hooks/useEditorRef';

type TabValue = 'editor' | 'tree' | 'transform';

export function AppShell() {
  const { rawJson, setRawJson, onChange } = useJsonDocument('');
  const editorRef = useEditorRef();
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [errorCount, setErrorCount] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<TabValue>('editor');

  return (
    <TooltipProvider>
      <div className="flex flex-col h-dvh bg-[#1e1e1e]">
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as TabValue)}
          className="flex flex-col flex-1 overflow-hidden"
        >
          {/* Tab bar — 36px */}
          <TabsList className="h-9 rounded-none bg-[#252526] border-b border-[#3e3e42] shrink-0 justify-start p-0 gap-0">
            <TabsTrigger
              value="editor"
              className="h-9 px-4 rounded-none data-[state=active]:bg-[#1e1e1e] data-[state=active]:text-[#d4d4d4] data-[state=active]:shadow-[inset_0_-3px_0_0_#0078d4] text-[#858585]"
            >
              <FileJson className="w-3.5 h-3.5 mr-1.5" />
              Editor
            </TabsTrigger>
            <TabsTrigger
              value="tree"
              className="h-9 px-4 rounded-none data-[state=active]:bg-[#1e1e1e] data-[state=active]:text-[#d4d4d4] data-[state=active]:shadow-[inset_0_-3px_0_0_#0078d4] text-[#858585]"
            >
              <GitBranch className="w-3.5 h-3.5 mr-1.5" />
              Tree
            </TabsTrigger>
            <Tooltip>
              <TooltipTrigger render={<span />}>
                <TabsTrigger
                  value="transform"
                  disabled
                  className="h-9 px-4 rounded-none opacity-40 text-[#858585]"
                >
                  <Zap className="w-3.5 h-3.5 mr-1.5" />
                  Transform
                </TabsTrigger>
              </TooltipTrigger>
              <TooltipContent>
                Transform with jq — available in the next phase
              </TooltipContent>
            </Tooltip>
          </TabsList>

          {/* Toolbar — 36px */}
          <Toolbar
            editorRef={editorRef}
            rawJson={rawJson}
            setRawJson={setRawJson}
            activeTab={activeTab}
          />

          {/* Content panel */}
          <TabsContent value="editor" className="flex-1 overflow-hidden m-0">
            <CodeMirrorEditor
              value={rawJson}
              onChange={onChange}
              onErrorCountChange={setErrorCount}
              editorRef={editorRef}
            />
          </TabsContent>
          <TabsContent value="tree" className="flex-1 overflow-auto m-0">
            <TreeErrorBoundary>
              <TreeView rawJson={rawJson} onNodeSelect={setSelectedPath} />
            </TreeErrorBoundary>
          </TabsContent>
          <TabsContent value="transform" className="flex-1 overflow-hidden m-0" />

          {/* Status bar — 28px */}
          <StatusBar selectedPath={selectedPath} errorCount={errorCount} />
        </Tabs>
      </div>
    </TooltipProvider>
  );
}
