import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TreeNode } from './TreeNode';

describe('TreeNode', () => {
  const noop = () => {};

  describe('primitive leaf', () => {
    it('renders string value', () => {
      render(
        <TreeNode
          nodeKey="name"
          value="Ada"
          path="$.name"
          depth={0}
          selectedPath={null}
          onSelect={noop}
        />
      );
      expect(screen.getByText('name')).toBeInTheDocument();
      expect(screen.getByText('"Ada"')).toBeInTheDocument();
    });

    it('renders numeric value', () => {
      render(
        <TreeNode
          nodeKey="age"
          value={36}
          path="$.age"
          depth={0}
          selectedPath={null}
          onSelect={noop}
        />
      );
      expect(screen.getByText('36')).toBeInTheDocument();
    });

    it('renders null value', () => {
      render(
        <TreeNode
          nodeKey="val"
          value={null}
          path="$.val"
          depth={0}
          selectedPath={null}
          onSelect={noop}
        />
      );
      expect(screen.getByText('null')).toBeInTheDocument();
    });

    it('calls onSelect with path when clicked', () => {
      const onSelect = vi.fn();
      render(
        <TreeNode
          nodeKey="name"
          value="Ada"
          path="$.name"
          depth={0}
          selectedPath={null}
          onSelect={onSelect}
        />
      );
      fireEvent.click(screen.getByText('name'));
      expect(onSelect).toHaveBeenCalledWith('$.name');
    });

    it('applies selected highlight class when selectedPath matches', () => {
      const { container } = render(
        <TreeNode
          nodeKey="name"
          value="Ada"
          path="$.name"
          depth={0}
          selectedPath="$.name"
          onSelect={noop}
        />
      );
      expect(container.firstChild).toHaveClass('bg-[#0078d41a]');
    });

    it('does NOT apply selected class when selectedPath differs', () => {
      const { container } = render(
        <TreeNode
          nodeKey="name"
          value="Ada"
          path="$.name"
          depth={0}
          selectedPath="$.other"
          onSelect={noop}
        />
      );
      expect(container.firstChild).not.toHaveClass('bg-[#0078d41a]');
    });
  });

  describe('object container', () => {
    const obj = { a: 1, b: 2 };

    it('renders collapsed preview at depth >= 2', () => {
      render(
        <TreeNode
          nodeKey="data"
          value={obj}
          path="$.data"
          depth={2}
          selectedPath={null}
          onSelect={noop}
        />
      );
      expect(screen.getByText('2 keys')).toBeInTheDocument();
    });

    it('renders expanded by default at depth < 2', () => {
      render(
        <TreeNode
          nodeKey="data"
          value={obj}
          path="$.data"
          depth={0}
          selectedPath={null}
          onSelect={noop}
        />
      );
      expect(screen.queryByText('2 keys')).not.toBeInTheDocument();
      expect(screen.getByText('a')).toBeInTheDocument();
      expect(screen.getByText('b')).toBeInTheDocument();
    });

    it('toggles expand on click and calls onSelect', () => {
      const onSelect = vi.fn();
      render(
        <TreeNode
          nodeKey="data"
          value={obj}
          path="$.data"
          depth={2}
          selectedPath={null}
          onSelect={onSelect}
        />
      );
      // Initially collapsed (depth 2)
      expect(screen.getByText('2 keys')).toBeInTheDocument();
      fireEvent.click(screen.getByText('data'));
      expect(onSelect).toHaveBeenCalledWith('$.data');
      // Now expanded
      expect(screen.queryByText('2 keys')).not.toBeInTheDocument();
    });

    it('uses singular "key" for single-key objects', () => {
      render(
        <TreeNode
          nodeKey="data"
          value={{ x: 1 }}
          path="$.data"
          depth={2}
          selectedPath={null}
          onSelect={noop}
        />
      );
      expect(screen.getByText('1 key')).toBeInTheDocument();
    });
  });

  describe('array container', () => {
    it('renders collapsed preview with items label', () => {
      render(
        <TreeNode
          nodeKey="items"
          value={[1, 2, 3]}
          path="$.items"
          depth={2}
          selectedPath={null}
          onSelect={noop}
        />
      );
      expect(screen.getByText('3 items')).toBeInTheDocument();
    });

    it('uses singular "item" for single-element arrays', () => {
      render(
        <TreeNode
          nodeKey="items"
          value={[1]}
          path="$.items"
          depth={2}
          selectedPath={null}
          onSelect={noop}
        />
      );
      expect(screen.getByText('1 item')).toBeInTheDocument();
    });

    it('renders children with correct paths when expanded', () => {
      render(
        <TreeNode
          nodeKey="items"
          value={[10, 20]}
          path="$.items"
          depth={0}
          selectedPath={null}
          onSelect={noop}
        />
      );
      // Array children render with numeric keys
      expect(screen.getByText('0')).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument();
    });
  });

  describe('indentation', () => {
    it('applies paddingLeft: depth * 16 inline style', () => {
      const { container } = render(
        <TreeNode
          nodeKey="x"
          value={42}
          path="$.x"
          depth={3}
          selectedPath={null}
          onSelect={noop}
        />
      );
      expect(container.firstChild).toHaveStyle({ paddingLeft: '48px' });
    });
  });
});
