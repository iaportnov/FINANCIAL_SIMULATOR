import "@fortune-sheet/react/dist/index.css";

import { Button, Stack } from "@mantine/core";
import { Workbook } from "@fortune-sheet/react";
import type { Cell, CellWithRowAndCol, Sheet } from "@fortune-sheet/core";
import type { WorkbookInstance } from "@fortune-sheet/react";
import { useMemo, useRef } from "react";

import type { CellModel } from "./api";

interface Props {
  sheet: { cells?: Record<string, { value?: unknown; formula?: string | null }> };
  editable: string[];
  onSubmit: (cells: CellModel) => void;
}

const READONLY_CELL_BG = "#f1f3f5";
const EDITABLE_CELL_BG = "#fff9db";
const NUMBER_FORMAT = "0.00";

// --- A1 <-> (row, col) helpers ---------------------------------------------
export function colToIndex(letters: string): number {
  let idx = 0;
  for (const ch of letters) idx = idx * 26 + (ch.charCodeAt(0) - 64);
  return idx - 1;
}

export function indexToCol(index: number): string {
  let n = index + 1;
  let out = "";
  while (n > 0) {
    const rem = (n - 1) % 26;
    out = String.fromCharCode(65 + rem) + out;
    n = Math.floor((n - 1) / 26);
  }
  return out;
}

export function a1ToRC(a1: string): { r: number; c: number } {
  const m = /^([A-Z]+)(\d+)$/.exec(a1.toUpperCase());
  if (!m) return { r: 0, c: 0 };
  return { c: colToIndex(m[1]), r: Number(m[2]) - 1 };
}

export function rcToA1(r: number, c: number): string {
  return `${indexToCol(c)}${r + 1}`;
}

function normalizeA1(a1: string): string {
  return a1.trim().toUpperCase();
}

function asFortuneCell(value: unknown, formula: string | null | undefined, editable: boolean): Cell {
  const cell: Cell = {
    bg: editable ? EDITABLE_CELL_BG : READONLY_CELL_BG,
    lo: editable ? 0 : 1,
  };

  if (typeof value === "number" && Number.isFinite(value)) {
    cell.v = value;
    cell.m = String(value);
    cell.ct = { fa: NUMBER_FORMAT, t: "n" };
  } else if (value !== null && value !== undefined) {
    cell.v = String(value);
    cell.m = String(value);
    cell.ct = { fa: "General", t: "g" };
  }

  const normalizedFormula = formula?.trim();
  if (normalizedFormula) {
    cell.f = normalizedFormula;
  }

  return cell;
}

export function buildTrainerSheet(
  sheet: Props["sheet"],
  editableCells: Set<string>,
): Sheet {
  let maxRow = 0;
  let maxCol = 0;
  const celldata = Object.entries(sheet.cells ?? {}).map(([a1, sourceCell]) => {
    const { r, c } = a1ToRC(a1);
    maxRow = Math.max(maxRow, r);
    maxCol = Math.max(maxCol, c);
    return {
      r,
      c,
      v: asFortuneCell(sourceCell.value ?? null, sourceCell.formula, editableCells.has(normalizeA1(a1))),
    };
  });

  return {
    name: "Sheet1",
    celldata,
    row: Math.max(maxRow + 3, 12),
    column: Math.max(maxCol + 3, 6),
    defaultColWidth: 150,
    defaultRowHeight: 28,
    config: {
      authority: {
        sheet: 1,
        selectLockedCells: 1,
        selectunLockedCells: 1,
        formatCells: 0,
        formatColumns: 0,
        formatRows: 0,
        insertColumns: 0,
        insertRows: 0,
        deleteColumns: 0,
        deleteRows: 0,
      },
      columnlen: {
        "0": 210,
        "1": 180,
      },
    },
  };
}

function readCellValue(cell: unknown): unknown {
  if (cell === null || cell === undefined) return null;
  if (typeof cell === "object" && "v" in cell) return (cell as Cell).v ?? null;
  return cell;
}

function readCellFormula(cell: unknown): string | null {
  if (cell === null || typeof cell !== "object" || !("f" in cell)) return null;
  const formula = (cell as Cell).f;
  return typeof formula === "string" && formula.trim() ? formula : null;
}

export function extractCellModel(sheet: Pick<Sheet, "celldata" | "data"> | undefined): CellModel {
  const cells: CellModel = {};

  if (sheet?.celldata) {
    for (const cd of sheet.celldata as CellWithRowAndCol[]) {
      const a1 = rcToA1(cd.r, cd.c);
      cells[a1] = { value: readCellValue(cd.v), formula: readCellFormula(cd.v) };
    }
  }

  if (sheet?.data) {
    sheet.data.forEach((row, r) => {
      row?.forEach((cell, c) => {
        if (cell === null || cell === undefined) return;
        const a1 = rcToA1(r, c);
        cells[a1] = { value: readCellValue(cell), formula: readCellFormula(cell) };
      });
    });
  }

  return cells;
}

/**
 * Adapter boundary. The whole rest of the app talks to this neutral interface
 * (task sheet in, CellModel out); the Fortune-sheet engine is isolated here, so
 * swapping engines later means rewriting only this file (see ADR-0006).
 */
export function SpreadsheetTrainer({ sheet, editable, onSubmit }: Props) {
  const ref = useRef<WorkbookInstance>(null);

  const editableCells = useMemo(() => new Set(editable.map(normalizeA1)), [editable]);
  const data = useMemo(() => [buildTrainerSheet(sheet, editableCells)], [editableCells, sheet]);

  const handleSubmit = () => {
    const currentSheet = ref.current?.getSheet?.() ?? ref.current?.getAllSheets?.()[0];
    onSubmit(extractCellModel(currentSheet));
  };

  return (
    <Stack>
      <div style={{ height: 420, minHeight: 420, width: "100%" }}>
        <Workbook
          ref={ref}
          data={data}
          lang="en"
          currency="$"
          defaultColWidth={150}
          defaultRowHeight={28}
          hooks={{
            beforeUpdateCell: (r, c) => editableCells.has(rcToA1(r, c)),
          }}
        />
      </div>
      <Button onClick={handleSubmit}>Проверить</Button>
    </Stack>
  );
}
