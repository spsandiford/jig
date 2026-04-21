import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TreeView } from './TreeView';

describe('TreeView', () => {
  it('empty rawJson renders empty state copy', () => {
    render(<TreeView rawJson="" onNodeSelect={vi.fn()} />);
    expect(screen.getByText('Paste or load JSON to get started')).toBeInTheDocument();
  });

  it('whitespace-only rawJson renders empty state copy', () => {
    render(<TreeView rawJson="   " onNodeSelect={vi.fn()} />);
    expect(screen.getByText('Paste or load JSON to get started')).toBeInTheDocument();
  });

  it('invalid JSON renders cannot display tree message', () => {
    render(<TreeView rawJson="{bad json" onNodeSelect={vi.fn()} />);
    expect(
      screen.getByText('Cannot display tree — JSON is not valid.')
    ).toBeInTheDocument();
  });

  it('rawJson longer than 2000000 bytes renders file too large message', () => {
    const bigJson = '"' + 'x'.repeat(2_000_001) + '"';
    render(<TreeView rawJson={bigJson} onNodeSelect={vi.fn()} />);
    expect(
      screen.getByText('File too large for tree view — use the editor.')
    ).toBeInTheDocument();
  });

  it('valid JSON renders a TreeNode with root nodeKey "$"', () => {
    render(<TreeView rawJson='{"name":"Ada"}' onNodeSelect={vi.fn()} />);
    // The root TreeNode renders with nodeKey="$"
    expect(screen.getByText('$')).toBeInTheDocument();
  });

  it('onNodeSelect callback is called when a leaf node is selected', () => {
    const onNodeSelect = vi.fn();
    render(<TreeView rawJson='{"name":"Ada"}' onNodeSelect={onNodeSelect} />);
    // Root node "$" is rendered at depth 0 (auto-expanded), child "name" is visible
    fireEvent.click(screen.getByText('name'));
    expect(onNodeSelect).toHaveBeenCalledWith('$.name');
  });
});
