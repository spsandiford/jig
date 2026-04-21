export interface TreeViewProps {
  rawJson: string;
  onNodeSelect: (path: string) => void;
}

// Stub — Plan 03 replaces this body with a recursive TreeNode-based renderer.
export function TreeView({ rawJson, onNodeSelect }: TreeViewProps) {
  void onNodeSelect;
  if (!rawJson.trim()) {
    return (
      <div className="p-4 text-[#858585] text-sm">
        Paste or load JSON to get started
      </div>
    );
  }
  return (
    <div data-testid="treeview-stub" className="p-4 text-[#858585] text-sm">
      Tree view (stub) — {rawJson.length} chars
    </div>
  );
}
