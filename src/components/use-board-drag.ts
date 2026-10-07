"use client";

import { useEffect, useRef, useState, type RefObject } from "react";

export type BoardDrag = {
  mealId: string;
  name: string;
  fromDayId: string | null;
  x: number;
  y: number;
  overDayId: string | null;
};

/**
 * Pointer drag from a meal card onto a day.
 * A mouse drag can start anywhere on the card. A touch that moves sideways
 * first is left alone, so the meal shelf can still scroll.
 * Click-to-place stays: a gesture that never crosses the threshold is a click.
 */
export function useBoardDrag(
  rootRef: RefObject<HTMLElement | null>,
  onDrop: (drop: {
    mealId: string;
    fromDayId: string | null;
    toDayId: string;
  }) => void,
) {
  const [drag, setDrag] = useState<BoardDrag | null>(null);
  const didDrag = useRef(false);
  const onDropRef = useRef(onDrop);
  onDropRef.current = onDrop;

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    let start: {
      x: number;
      y: number;
      pointerId: number;
      mealId: string;
      name: string;
      fromDayId: string | null;
      pointerType: string;
    } | null = null;
    let dragging = false;

    function dayUnder(x: number, y: number) {
      const el = document.elementFromPoint(x, y);
      const zone = el?.closest("[data-drop-day]") as HTMLElement | null;
      return zone?.dataset.dropDay ?? null;
    }

    function onDown(event: PointerEvent) {
      if (event.button !== 0) return;
      const target = event.target as HTMLElement | null;
      if (!target) return;
      if (target.closest("button, a, input, select, textarea, label")) return;
      const card = target.closest("[data-drag-meal]") as HTMLElement | null;
      if (!card?.dataset.dragMeal) return;
      start = {
        x: event.clientX,
        y: event.clientY,
        pointerId: event.pointerId,
        mealId: card.dataset.dragMeal,
        name: card.dataset.dragName ?? "Meal",
        fromDayId: card.dataset.dragFrom || null,
        pointerType: event.pointerType,
      };
      dragging = false;
      if (event.pointerType === "mouse") event.preventDefault();
    }

    function onMove(event: PointerEvent) {
      if (!start || event.pointerId !== start.pointerId) return;
      const dx = event.clientX - start.x;
      const dy = event.clientY - start.y;
      if (!dragging) {
        if (Math.hypot(dx, dy) < 8) return;
        const fromShelf = !start.fromDayId;
        if (
          start.pointerType !== "mouse" &&
          fromShelf &&
          Math.abs(dx) > Math.abs(dy)
        ) {
          start = null;
          return;
        }
        dragging = true;
        didDrag.current = true;
      }
      event.preventDefault();
      setDrag({
        mealId: start.mealId,
        name: start.name,
        fromDayId: start.fromDayId,
        x: event.clientX,
        y: event.clientY,
        overDayId: dayUnder(event.clientX, event.clientY),
      });
    }

    function onUp(event: PointerEvent) {
      if (!start || event.pointerId !== start.pointerId) return;
      const info = start;
      const wasDragging = dragging;
      start = null;
      dragging = false;
      const toDayId = wasDragging ? dayUnder(event.clientX, event.clientY) : null;
      setDrag(null);
      if (wasDragging && toDayId && toDayId !== info.fromDayId) {
        onDropRef.current({
          mealId: info.mealId,
          fromDayId: info.fromDayId,
          toDayId,
        });
      }
    }

    root.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove, { passive: false });
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      root.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [rootRef]);

  return { drag, didDrag };
}
