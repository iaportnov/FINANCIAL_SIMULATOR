import supportedFormulas from "@fortune-sheet/formula-parser/lib/supported-formulas";

import { buildTrainerSheet, extractCellModel } from "./SpreadsheetTrainer";

describe("SpreadsheetTrainer adapter", () => {
  it("builds visible numeric cells and locks non-editable source cells", () => {
    const sheet = buildTrainerSheet(
      {
        cells: {
          A1: { value: "Сумма кредита" },
          B1: { value: 500000 },
          B5: { value: null },
        },
      },
      new Set(["B5"]),
    );

    const b1 = sheet.celldata?.find((cell) => cell.r === 0 && cell.c === 1)?.v;
    const b5 = sheet.celldata?.find((cell) => cell.r === 4 && cell.c === 1)?.v;

    expect(b1).toMatchObject({
      v: 500000,
      m: "500000",
      ct: { fa: "0.00", t: "n" },
      lo: 1,
    });
    expect(b5).toMatchObject({ lo: 0 });
    expect(sheet.config?.authority?.sheet).toBe(1);
  });

  it("preserves authored formulas in the initial sheet", () => {
    const sheet = buildTrainerSheet(
      {
        cells: {
          B1: { value: 100 },
          B2: { value: 120, formula: "B1*1.2" },
        },
      },
      new Set(["B2"]),
    );

    const b2 = sheet.celldata?.find((cell) => cell.r === 1 && cell.c === 1)?.v;

    expect(b2).toMatchObject({
      v: 120,
      f: "B1*1.2",
      lo: 0,
    });
  });

  it("extracts the neutral cell model from Fortune-sheet data or celldata", () => {
    expect(
      extractCellModel({
        data: [
          [null, { v: 500000, m: "500000", ct: { fa: "0.00", t: "n" } }],
          [],
          [],
          [],
          [null, { v: 44424.36, f: "B1*(B2/12/100)" }],
        ],
      }),
    ).toMatchObject({
      B1: { value: 500000, formula: null },
      B5: { value: 44424.36, formula: "B1*(B2/12/100)" },
    });

    expect(
      extractCellModel({
        celldata: [{ r: 3, c: 1, v: { v: 10000, f: "=B1/B2" } }],
      }),
    ).toMatchObject({
      B4: { value: 10000, formula: "=B1/B2" },
    });
  });

  it("has financial PMT formulas available in the bundled engine", () => {
    expect(supportedFormulas).toEqual(expect.arrayContaining(["PMT", "IPMT", "PPMT"]));
  });
});
