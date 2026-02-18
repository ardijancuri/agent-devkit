'use client';

import {
  Plus, LayoutGrid, ZoomIn, ZoomOut, Maximize, Undo2, Redo2, Save, Play,
} from 'lucide-react';

interface CanvasToolbarProps {
  onAddAgent: () => void;
  onAutoLayout: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitView: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onSave: () => void;
  onRun: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

function ToolbarButton({
  icon: Icon,
  label,
  shortcut,
  onClick,
  disabled,
  variant,
}: {
  icon: React.ElementType;
  label: string;
  shortcut?: string;
  onClick: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'success';
}) {
  const base = 'p-2 rounded-lg transition-colors disabled:opacity-30';
  const variants = {
    primary: 'bg-gh-accent-emphasis hover:bg-gh-accent text-gh-fg',
    success: 'bg-green-600 hover:bg-green-500 text-gh-fg',
    default: 'text-gh-fg-muted hover:text-gh-fg hover:bg-gh-btn-hover',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${variants[variant ?? 'default']}`}
      title={shortcut ? `${label} (${shortcut})` : label}
    >
      <Icon className="w-4 h-4" />
    </button>
  );
}

export default function CanvasToolbar(props: CanvasToolbarProps) {
  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1 bg-gh-subtle/90 backdrop-blur border border-gh-border rounded-xl px-2 py-1.5 shadow-xl">
      <ToolbarButton icon={Plus} label="Add Agent" shortcut="A" onClick={props.onAddAgent} />
      <div className="w-px h-5 bg-gh-btn-hover mx-1" />
      <ToolbarButton icon={LayoutGrid} label="Auto Layout" shortcut="L" onClick={props.onAutoLayout} />
      <ToolbarButton icon={ZoomIn} label="Zoom In" shortcut="+" onClick={props.onZoomIn} />
      <ToolbarButton icon={ZoomOut} label="Zoom Out" shortcut="-" onClick={props.onZoomOut} />
      <ToolbarButton icon={Maximize} label="Fit View" shortcut="F" onClick={props.onFitView} />
      <div className="w-px h-5 bg-gh-btn-hover mx-1" />
      <ToolbarButton icon={Undo2} label="Undo" shortcut="⌘Z" onClick={props.onUndo} disabled={!props.canUndo} />
      <ToolbarButton icon={Redo2} label="Redo" shortcut="⌘⇧Z" onClick={props.onRedo} disabled={!props.canRedo} />
      <div className="w-px h-5 bg-gh-btn-hover mx-1" />
      <ToolbarButton icon={Save} label="Save" shortcut="⌘S" onClick={props.onSave} variant="primary" />
      <ToolbarButton icon={Play} label="Run" shortcut="⌘Enter" onClick={props.onRun} variant="success" />
    </div>
  );
}
