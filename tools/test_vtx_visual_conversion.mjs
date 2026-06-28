#!/usr/bin/env node
import assert from "node:assert/strict";

function getVtxTablePowerValueVisualOffset(powerLevelList) {
    if (!Array.isArray(powerLevelList) || powerLevelList.length === 0) {
        return 0;
    }

    const values = powerLevelList
        .map((item) => Number.parseInt(item?.vtxtable_powerlevel_value, 10))
        .filter((value) => Number.isFinite(value));

    if (values.length !== powerLevelList.length || values.length === 0) {
        return 0;
    }

    const min = Math.min(...values);
    const max = Math.max(...values);
    const hasZero = values.includes(0);
    const count = values.length;

    return hasZero && min === 0 && max <= count ? 1 : 0;
}

function toUi(value, offset) {
    const numericValue = Number.parseInt(value, 10);
    return Number.isFinite(numericValue) ? numericValue + offset : "";
}

function toBetaflight(value, offset) {
    const numericValue = Number.parseInt(value, 10);
    return Number.isFinite(numericValue) ? Math.max(0, numericValue - offset) : 0;
}

function list(values) {
    return values.map((v) => ({ vtxtable_powerlevel_value: v }));
}

let raw = list([0, 1, 2, 3]);
let offset = getVtxTablePowerValueVisualOffset(raw);
assert.equal(offset, 1);
assert.deepEqual(raw.map((x) => toUi(x.vtxtable_powerlevel_value, offset)), [1, 2, 3, 4]);
assert.deepEqual([1, 2, 3, 4].map((x) => toBetaflight(x, offset)), [0, 1, 2, 3]);

raw = list([25, 200, 500, 800]);
offset = getVtxTablePowerValueVisualOffset(raw);
assert.equal(offset, 0);
assert.deepEqual(raw.map((x) => toUi(x.vtxtable_powerlevel_value, offset)), [25, 200, 500, 800]);
assert.deepEqual([25, 200, 500, 800].map((x) => toBetaflight(x, offset)), [25, 200, 500, 800]);

raw = list([1, 2, 3, 4]);
offset = getVtxTablePowerValueVisualOffset(raw);
assert.equal(offset, 0);
assert.deepEqual(raw.map((x) => toUi(x.vtxtable_powerlevel_value, offset)), [1, 2, 3, 4]);
assert.deepEqual([1, 2, 3, 4].map((x) => toBetaflight(x, offset)), [1, 2, 3, 4]);

console.log("OK: visual-only conversion tests passed.");
