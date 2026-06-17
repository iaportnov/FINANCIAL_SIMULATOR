import "@fortune-sheet/react/dist/index.css";

import { Button, Stack } from "@mantine/core";
import { Workbook } from "@fortune-sheet/react";
import { useRef } from "react";

import type { CellModel } from "./api";

interface Props {
  sheet: { cells?: Record<string, { value?: unknown }> };
  editable: string[];
  onSubmit: (cells: CellModel) => void;
}

// --- A1 <-> (row, col) helpers ---------------------------------------------
function colToIndex(letters: string): number {
  let idx = 0;
  for (const ch of letters) idx = idx * 26 + (ch.charCodeAt(0) - 64);
  return idx - 1;
}

function indexToCol(index: number): string {
  let n = index + 1;
  let out = "";
  while (n > 0) {
    const rem = (n - 1) % 26;
    out = String.fromCharCode(65 + rem) + out;
    n = Math.floor((n - 1) / 26);
  }
  return out;
}

function a1ToRC(a1: string): { r: number; c: number } {
  const m = /^([A-Z]+)(\d+)$/.exec(a1.toUpperCase());
  if (!m) return { r: 0, c: 0 };
  return { c: colToIndex(m[1]), r: Number(m[2]) - 1 };
}

function rcToA1(r: number, c: number): string {
  return `${indexToCol(c)}${r + 1}`;
}

/**
 * Adapter boundary. The whole rest of the app talks to this neutral interface
 * (task sheet in, CellModel out); the Fortune-sheet engine is isolated here, so
 * swapping engines later means rewriting only this file (see ADR-0006).
 */
export function SpreadsheetTrainer({ sheet, editable, onSubmit }: Props) {
  const ref = useRef<any>(null);

  const celldata = Object.entries(sheet.cells ?? {}).map(([a1, cell]) => {
    const { r, c } = a1ToRC(a1);
    return { r, c, v: { v: cell.value ?? null } };
  });
  const data = [{ name: "Sheet1", celldata }];

  const handleSubmit = () => {
    const sheets = ref.current?.getAllSheets?.() ?? [];
    const first = sheets[0] ?? {};
    const cells: CellModel = {};
    for (const cd of first.celldata ?? []) {
      const a1 = rcToA1(cd.r, cd.c);
      cells[a1] = { value: cd.v?.v ?? null, formula: cd.v?.f ?? null };
    }
    onSubmit(cells);
  };

  return (
    <Stack>
      <div style={{ height: 400 }}>
        <Workbook ref={ref} data={data as any} />
      </div>
      {/* TODO: lock non-editable cells using `editable` via Fortune-sheet config. */}
      <div data-editable={editable.join(",")} hidden />
      <Button onClick={handleSubmit}>Проверить</Button>
    </Stack>
  );
}
