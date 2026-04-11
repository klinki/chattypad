import React, { useState, useEffect } from "react";

interface MenuItem {
  label: string;
  onClick?: () => void;
  danger?: boolean;
  submenu?: MenuItem[];
}

interface ContextMenuProps {
  x: number;
  y: number;
  items: MenuItem[];
  onClose: () => void;
}

export function ContextMenu({ x, y, items, onClose }: ContextMenuProps) {
  useEffect(() => {
    const handleClick = () => onClose();
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [onClose]);

  return (
    <div
      style={{
        position: "fixed",
        top: y,
        left: x,
        background: "var(--bg-sidebar)",
        border: "1px solid var(--border-subtle)",
        borderRadius: 6,
        padding: "6px 0",
        minWidth: 180,
        boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
        zIndex: 1000,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {items.map((item, idx) => (
        <ContextMenuItem key={idx} item={item} onClose={onClose} />
      ))}
    </div>
  );
}

function ContextMenuItem({ item, onClose }: { item: MenuItem; onClose: () => void }) {
  const [showSub, setShowSub] = useState(false);

  return (
    <div
      style={{
        position: "relative",
        padding: "8px 14px",
        fontSize: 13,
        color: item.danger ? "var(--text-error)" : "var(--text-main)",
        cursor: "pointer",
        display: "flex",
        justifyContent: "space-between",
        transition: "background-color 0.15s ease",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.backgroundColor = "var(--bg-hover)";
        setShowSub(true);
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.backgroundColor = "transparent";
        setShowSub(false);
      }}
      onClick={() => {
        if (!item.submenu && item.onClick) {
          item.onClick();
          onClose();
        }
      }}
    >
      {item.label}
      {item.submenu && <span>▶</span>}
      {item.submenu && showSub && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: "100%",
            background: "var(--bg-sidebar)",
            border: "1px solid var(--border-subtle)",
            borderRadius: 6,
            padding: "6px 0",
            minWidth: 180,
            boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
          }}
        >
          {item.submenu.map((sub, idx) => (
            <ContextMenuItem key={idx} item={sub} onClose={onClose} />
          ))}
        </div>
      )}
    </div>
  );
}
