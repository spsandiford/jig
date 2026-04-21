import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatusBar } from './StatusBar';

describe('StatusBar', () => {
  it('selectedPath=null renders empty path placeholder', () => {
    render(<StatusBar selectedPath={null} errorCount={0} rawJson="" />);
    expect(
      screen.getByText('Select a node in the Tree view to see its path')
    ).toBeInTheDocument();
  });

  it('selectedPath="$.foo" renders the path', () => {
    render(<StatusBar selectedPath="$.foo" errorCount={0} rawJson='{"foo":1}' />);
    expect(screen.getByText('$.foo')).toBeInTheDocument();
  });

  it('errorCount > 0 renders singular error badge', () => {
    render(<StatusBar selectedPath={null} errorCount={1} rawJson='{"a":' />);
    expect(screen.getByText('1 error')).toBeInTheDocument();
  });

  it('errorCount > 1 renders plural errors badge', () => {
    render(<StatusBar selectedPath={null} errorCount={3} rawJson='{"a":' />);
    expect(screen.getByText('3 errors')).toBeInTheDocument();
  });

  it('errorCount=0 + rawJson non-empty renders "Valid JSON"', () => {
    render(<StatusBar selectedPath={null} errorCount={0} rawJson='{"a":1}' />);
    expect(screen.getByText('Valid JSON')).toBeInTheDocument();
  });

  it('errorCount=0 + rawJson empty renders empty slot (no "Valid JSON")', () => {
    render(<StatusBar selectedPath={null} errorCount={0} rawJson="" />);
    expect(screen.queryByText('Valid JSON')).not.toBeInTheDocument();
  });

  it('errorCount=0 + rawJson=undefined renders "Valid JSON" (backwards compat)', () => {
    render(<StatusBar selectedPath={null} errorCount={0} />);
    expect(screen.getByText('Valid JSON')).toBeInTheDocument();
  });
});
