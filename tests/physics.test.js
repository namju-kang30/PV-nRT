import test from "node:test";
import assert from "node:assert/strict";
import { stateAt, R } from "../src/physics.js";
const base = { n: 1, temperature: 300, volume: 20, gamma: 5 / 3, ratio: 2 };
const close = (a, b) =>
  assert.ok(Math.abs(a - b) < 1e-7 * Math.max(1, Math.abs(b)), `${a} ≠ ${b}`);
test("isothermal expansion: analytical work, constant temperature, heat equals work", () => {
  const s = stateAt({ ...base, process: "isothermal" });
  close(s.T, 300);
  close(s.P, s.P0 / 2);
  close(s.dU, 0);
  close(s.W, R * 300 * Math.log(2));
  close(s.Q, s.W);
});
test("isobaric expansion: temperature doubles, work is pressure times volume change", () => {
  const s = stateAt({ ...base, process: "isobaric" });
  close(s.P, s.P0);
  close(s.T, 600);
  close(s.W, R * 300);
  close(s.Q, 2.5 * R * 300);
});
test("isochoric heating: no work, pressure doubles", () => {
  const s = stateAt({ ...base, process: "isochoric" });
  close(s.V, 0.02);
  close(s.W, 0);
  close(s.P, 2 * s.P0);
  close(s.Q, s.dU);
});
test("adiabatic expansion cools and conserves PV^gamma", () => {
  const s = stateAt({ ...base, process: "adiabatic" });
  close(s.Q, 0);
  assert.ok(s.T < 300);
  close(s.P * s.V ** base.gamma, s.P0 * s.V0 ** base.gamma);
  close(s.W, -s.dU);
});
test("all processes satisfy ideal gas equation and first law through heating, cooling, expansion and compression", () => {
  for (const process of ["isothermal", "isobaric", "isochoric", "adiabatic"]) {
    for (const gamma of [5 / 3, 1.4])
      for (const ratio of [0.5, 1, 2.5])
        for (const progress of [0, 0.2, 0.7, 1]) {
          const s = stateAt(
            { ...base, process, gamma, ratio, n: 2.5 },
            progress,
          );
          close(s.P * s.V, 2.5 * R * s.T);
          close(s.Q - s.W, s.dU);
          if (!progress) {
            close(s.W, 0);
            close(s.dU, 0);
          }
          if (ratio < 1 && process !== "isochoric" && progress > 0)
            assert.ok(s.W < 0);
        }
  }
});
