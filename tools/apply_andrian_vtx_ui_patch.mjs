#!/usr/bin/env node
/**
 * Andrian VTX One-Based UI patch for Betaflight App / Configurator.
 *
 * Goal:
 *   - show zero-based VTX Table Power Values as 1-based values in the UI;
 *   - keep Betaflight/MSP/JSON saved values unchanged and compatible;
 *   - do NOT shift frequencies, bands, channels, selected vtx_power, labels, or normal mW values.
 *
 * Usage from a cloned fork of betaflight/betaflight-configurator:
 *   node tools/apply_andrian_vtx_ui_patch.mjs
 */

import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const vtxPath = path.join(repoRoot, "src", "js", "tabs", "vtx.js");

if (!fs.existsSync(vtxPath)) {
    console.error(`Cannot find ${vtxPath}`);
    console.error("Run this script from the root of betaflight-configurator.");
    process.exit(1);
}

let source = fs.readFileSync(vtxPath, "utf8");

if (source.includes("ANDRIAN_VTX_ONE_BASED_UI")) {
    console.log("Andrian VTX UI patch is already applied. Nothing to do.");
    process.exit(0);
}

const helpers = `
// Andrian VTX One-Based UI patch.
// This patch is intentionally visual-only:
// Betaflight internally still receives and stores the original zero-based values.
const ANDRIAN_VTX_ONE_BASED_UI = true;

function getVtxTablePowerValueVisualOffset(powerLevelList) {
    if (!ANDRIAN_VTX_ONE_BASED_UI || !Array.isArray(powerLevelList) || powerLevelList.length === 0) {
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

    // SmartAudio 2.0 / control-index style tables are typically 0,1,2,3...
    // Real mW tables like 25,200,500,800 must stay unchanged.
    const looksLikeZeroBasedControlValues = hasZero && min === 0 && max <= count;

    return looksLikeZeroBasedControlValues ? 1 : 0;
}

function getCurrentVtxPowerValueVisualOffset() {
    if (typeof TABS.vtx.vtxTablePowerValueVisualOffset === "number") {
        return TABS.vtx.vtxTablePowerValueVisualOffset;
    }

    return getVtxTablePowerValueVisualOffset(TABS.vtx.VTXTABLE_POWERLEVEL_LIST);
}

function vtxTablePowerValueToUi(value, offset) {
    const numericValue = Number.parseInt(value, 10);

    if (!Number.isFinite(numericValue)) {
        return "";
    }

    return numericValue + offset;
}

function vtxTablePowerValueToBetaflight(value, offset) {
    const numericValue = Number.parseInt(value, 10);

    if (!Number.isFinite(numericValue)) {
        return 0;
    }

    return Math.max(0, numericValue - offset);
}
`;

function replaceOnce(regex, replacement, label) {
    if (!regex.test(source)) {
        console.error(`Patch point not found: ${label}`);
        process.exit(2);
    }
    source = source.replace(regex, replacement);
    console.log(`Patched: ${label}`);
}

replaceOnce(
    /};\s*vtx\.isVtxDeviceStatusReady\s*=\s*function\s*\(\)\s*{/, 
    `};\n${helpers}\nvtx.isVtxDeviceStatusReady = function () {`,
    "insert visual-only helper functions",
);

replaceOnce(
    /\$\("#vtx_table_powerlevels"\)\.val\(FC\.VTX_CONFIG\.vtx_table_powerlevels\);\s*\/\/ Populate power levels/,
    `$("#vtx_table_powerlevels").val(FC.VTX_CONFIG.vtx_table_powerlevels);\n        TABS.vtx.vtxTablePowerValueVisualOffset = getVtxTablePowerValueVisualOffset(TABS.vtx.VTXTABLE_POWERLEVEL_LIST);\n        /* Populate power levels */`,
    "calculate visual offset before rendering power values",
);

replaceOnce(
    /\$\(`#vtx_table_powerlevels_\$\{i\}`\)\.val\(\s*TABS\.vtx\.VTXTABLE_POWERLEVEL_LIST\[i - 1\]\.vtxtable_powerlevel_value\s*\);/,
    `$(\`#vtx_table_powerlevels_\${i}\`).val(\n                vtxTablePowerValueToUi(\n                    TABS.vtx.VTXTABLE_POWERLEVEL_LIST[i - 1].vtxtable_powerlevel_value,\n                    getCurrentVtxPowerValueVisualOffset(),\n                ),\n            );`,
    "render zero-based power values as one-based in UI",
);

replaceOnce(
    /TABS\.vtx\.VTXTABLE_POWERLEVEL_LIST\[i - 1\]\.vtxtable_powerlevel_value\s*=\s*parseInt\(\s*\$\(`#vtx_table_powerlevels_\$\{i\}`\)\.val\(\),?\s*\);/,
    `TABS.vtx.VTXTABLE_POWERLEVEL_LIST[i - 1].vtxtable_powerlevel_value = vtxTablePowerValueToBetaflight(\n            $(\`#vtx_table_powerlevels_\${i}\`).val(),\n            getCurrentVtxPowerValueVisualOffset(),\n        );`,
    "convert one-based UI power values back to Betaflight format before Save / Save File",
);

fs.writeFileSync(vtxPath, source, "utf8");
console.log("Done. Review with: git diff src/js/tabs/vtx.js");
