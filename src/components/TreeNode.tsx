import { useState } from 'react';
import { buildPath } from '../lib/jsonPath';

export interface TreeNodeProps {
  nodeKey: string | number;
  value: unknown;
  path: string;
  depth: number;
  selectedPath: string | null;
  onSelect: (path: string) => void;
}

export function TreeNode({
  nodeKey,
  value,
  path,
  depth,
  selectedPath,
  onSelect,
}: TreeNodeProps) {
  const [expanded, setExpanded] = useState<boolean>(depth < 2);

  const isArray = Array.isArray(value);
  const isObject = !isArray && value !== null && typeof value === 'object';
  const isContainer = isArray || isObject;
  const isSelected = selectedPath === path;

  const indent = depth * 16;
  const rowBase =
    'flex items-center gap-1 py-0.5 px-2 cursor-pointer rounded select-none font-mono text-sm';
  const rowState = isSelected
    ? 'bg-[#0078d41a] hover:bg-[#0078d426]'
    : 'hover:bg-[#2a2d2e] active:bg-[#37373d]';
  const rowClass = `${rowBase} ${rowState}`;

  if (!isContainer) {
    // Primitive leaf
    return (
      <div
        style={{ paddingLeft: indent }}
        className={rowClass}
        onClick={() => onSelect(path)}
      >
        <span className="w-3 text-center" />
        <span className="text-[#9cdcfe]">{String(nodeKey)}</span>
        <span className="text-[#858585]">:</span>
        <span className="text-[#ce9178]">{JSON.stringify(value)}</span>
      </div>
    );
  }

  const entries: Array<[string | number, unknown]> = isArray
    ? (value as unknown[]).map((v, i) => [i, v])
    : Object.entries(value as Record<string, unknown>);
  const openBracket = isArray ? '[' : '{';
  const closeBracket = isArray ? ']' : '}';
  const count = entries.length;
  const previewLabel = isArray
    ? `${count} ${count === 1 ? 'item' : 'items'}`
    : `${count} ${count === 1 ? 'key' : 'keys'}`;

  return (
    <div>
      <div
        style={{ paddingLeft: indent }}
        className={rowClass}
        onClick={() => {
          setExpanded((e) => !e);
          onSelect(path);
        }}
      >
        <span className="text-[#858585] w-3 text-center">
          {expanded ? '▾' : '▸'}
        </span>
        <span className="text-[#9cdcfe]">{String(nodeKey)}</span>
        <span className="text-[#858585]">: {openBracket}</span>
        {!expanded && (
          <>
            <span className="text-[#858585] text-xs ml-1">{previewLabel}</span>
            <span className="text-[#858585] ml-1">{closeBracket}</span>
          </>
        )}
      </div>
      {expanded && (
        <>
          {entries.map(([k, v]) => (
            <TreeNode
              key={String(k)}
              nodeKey={k}
              value={v}
              path={buildPath(path, k)}
              depth={depth + 1}
              selectedPath={selectedPath}
              onSelect={onSelect}
            />
          ))}
          <div
            style={{ paddingLeft: indent }}
            className="font-mono text-sm text-[#858585] px-2"
          >
            <span className="w-3 text-center inline-block" />
            {closeBracket}
          </div>
        </>
      )}
    </div>
  );
}
