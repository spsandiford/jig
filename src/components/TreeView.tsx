import { useMemo, useState } from 'react';
import { TreeNode } from './TreeNode';

export interface TreeViewProps {
  rawJson: string;
  onNodeSelect: (path: string) => void;
}

const SIZE_GATE_BYTES = 2_000_000;

type Parsed =
  | { status: 'ok'; value: unknown }
  | { status: 'empty' }
  | { status: 'invalid' }
  | { status: 'oversize' };

function parse(rawJson: string): Parsed {
  if (!rawJson.trim()) return { status: 'empty' };
  if (rawJson.length > SIZE_GATE_BYTES) return { status: 'oversize' };
  try {
    return { status: 'ok', value: JSON.parse(rawJson) };
  } catch {
    return { status: 'invalid' };
  }
}

export function TreeView({ rawJson, onNodeSelect }: TreeViewProps) {
  const parsed = useMemo<Parsed>(() => parse(rawJson), [rawJson]);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);

  function handleSelect(path: string) {
    setSelectedPath(path);
    onNodeSelect(path);
  }

  if (parsed.status === 'empty') {
    return (
      <div className="p-6 text-[#858585] text-sm">
        <div className="text-base font-semibold text-[#d4d4d4] mb-2">
          Paste or load JSON to get started
        </div>
        <div>
          Paste JSON into the editor, or click Open File to load a .json file
          from disk.
        </div>
      </div>
    );
  }

  if (parsed.status === 'oversize') {
    return (
      <div className="p-4 text-[#858585] text-sm">
        File too large for tree view — use the editor.
      </div>
    );
  }

  if (parsed.status === 'invalid') {
    return (
      <div className="p-4 text-[#858585] text-sm">
        Cannot display tree — JSON is not valid.
      </div>
    );
  }

  return (
    <div className="p-2 text-[#d4d4d4]">
      <TreeNode
        nodeKey="$"
        value={parsed.value}
        path="$"
        depth={0}
        selectedPath={selectedPath}
        onSelect={handleSelect}
      />
    </div>
  );
}
