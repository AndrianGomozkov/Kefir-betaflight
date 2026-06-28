#!/usr/bin/env node
/**
 * Kefir VTX One-Based UI patch for Betaflight App / Configurator.
 *
 * Visual-only goal:
 *   - zero-based VTX Table Power Values such as 0,1,2,3 are shown as 1,2,3,4 in the UI;
 *   - before Save / Save File / Save Lua the UI values are converted back to Betaflight values;
 *   - normal mW values such as 25,200,500,800 stay unchanged;
 *   - frequencies, bands, channels, selected vtx_power and labels are not shifted.
 *
 * Usage:
 *   Run from the root of a cloned betaflight-configurator repository:
 *     node tools/apply_kefir_vtx_ui_patch.mjs
 */

import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();

function walkFiles(dir, maxDepth = 8, depth = 0, out = []) {
    if (depth > maxDepth || !fs.existsSync(dir)) {
        return out;
    }

    let entries = [];
    try {
        entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
        return out;
    }

    for (const entry of entries) {
        if (entry.name === "node_modules" || entry.name === ".git" || entry.name === "dist") {
            continue;
        }

        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            walkFiles(fullPath, maxDepth, depth + 1, out);
        } else {
            out.push(fullPath);
        }
    }

    return out;
}

function findVtxJsFile() {
    const candidates = [
        path.join(repoRoot, "src", "js", "tabs", "vtx.js"),
        path.join(repoRoot, "src", "tabs", "vtx.js"),
    ];

    for (const candidate of candidates) {
        if (fs.existsSync(candidate)) {
            return candidate;
        }
    }

    const found = walkFiles(repoRoot)
        .filter((file) => path.basename(file) === "vtx.js")
        .map((file) => ({ file, text: fs.readFileSync(file, "utf8") }))
        .find(({ text }) => text.includes("dump_html_to_msp") && text.includes("VTXTABLE_POWERLEVEL_LIST"));

    return found?.file ?? null;
}

const vtxPath = findVtxJsFile();

if (!vtxPath) {
    console.error("Cannot find Betaflight VTX tab source file.");
    console.error(`Current directory: ${repoRoot}`);
    console.error("Top-level files/directories:");
    for (const item of fs.readdirSync(repoRoot)) {
        console.error(` - ${item}`);
    }
    const possible = walkFiles(repoRoot, 5).filter((file) => /vtx/i.test(file));
    if (possible.length > 0) {
        console.error("Files containing 'vtx' in the name:");
        for (const file of possible.slice(0, 50)) {
            console.error(` - ${path.relative(repoRoot, file)}`);
        }
    }
    console.error("This usually means the Betaflight source was not downloaded into the 'app' folder or the upstream layout changed.");
    process.exit(1);
}

let source = fs.readFileSync(vtxPath, "utf8");

if (source.includes("KEFIR_VTX_ONE_BASED_UI")) {
    console.log(`Kefir VTX UI patch is already applied in ${path.relative(repoRoot, vtxPath)}. Nothing to do.`);
    process.exit(0);
}

const helpers = `
// Kefir VTX One-Based UI patch.
// This patch is intentionally visual-only:
// Betaflight internally still receives and stores the original zero-based values.
const KEFIR_VTX_ONE_BASED_UI = true;

function getVtxTablePowerValueVisualOffset(powerLevelList) {
    if (!KEFIR_VTX_ONE_BASED_UI || !Array.isArray(powerLevelList) || powerLevelList.length === 0) {
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
        console.error(`File: ${path.relative(repoRoot, vtxPath)}`);
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
    /\$\("#vtx_table_powerlevels"\)\.val\(FC\.VTX_CONFIG\.vtx_table_powerlevels\);\s*(?:\/\/\s*Populate power levels|\/\*\s*Populate power levels\s*\*\/)/,
    `$("#vtx_table_powerlevels").val(FC.VTX_CONFIG.vtx_table_powerlevels);\n        TABS.vtx.vtxTablePowerValueVisualOffset = getVtxTablePowerValueVisualOffset(TABS.vtx.VTXTABLE_POWERLEVEL_LIST);\n        // Populate power levels`,
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
    "convert one-based UI power values back to Betaflight format before Save / Save File / Save Lua",
);

fs.writeFileSync(vtxPath, source, "utf8");
console.log(`Done. Patched ${path.relative(repoRoot, vtxPath)}`);
