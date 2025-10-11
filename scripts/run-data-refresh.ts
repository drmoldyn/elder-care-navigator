#!/usr/bin/env tsx
/**
 * Nightly data refresh orchestrator
 *
 * This script sequences the download → processing → import steps
 * for CMS and state datasets. It is designed to run in CI (GitHub
 * Actions) with Supabase credentials provided via environment
 * variables.
 *
 * Set DRY_RUN=true to execute read-only steps without writing to
 * Supabase (useful for staging validation).
 */

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

interface Task {
  title: string;
  command: string;
  args: string[];
  requiredPaths?: string[];
  env?: Record<string, string>;
}

const DRY_RUN = process.env.DRY_RUN === "true";

function logHeader(message: string) {
  const divider = "=".repeat(message.length + 8);
  console.log(`\n${divider}`);
  console.log(`=== ${message} ===`);
  console.log(`${divider}\n`);
}

function runTask(task: Task) {
  if (task.requiredPaths) {
    const missing = task.requiredPaths.filter((p) => !fs.existsSync(path.resolve(p)));
    if (missing.length > 0) {
      console.log(`⏭️  Skipping "${task.title}" (missing: ${missing.join(", ")})`);
      return;
    }
  }

  logHeader(task.title);

  const result = spawnSync(task.command, task.args, {
    stdio: "inherit",
    env: {
      ...process.env,
      ...task.env,
      DRY_RUN: DRY_RUN ? "true" : process.env.DRY_RUN ?? "false",
    },
  });

  if (result.status !== 0) {
    throw new Error(`Task failed: ${task.title}`);
  }
}

const downloadTasks: Task[] = [
  {
    title: "Download CMS nursing-home quality datasets",
    command: "bash",
    args: ["scripts/download-cms-quality-data.sh"],
    requiredPaths: ["scripts/download-cms-quality-data.sh"],
  },
  {
    title: "Download CMS home health datasets",
    command: "bash",
    args: ["scripts/download-cms-homehealth-data.sh"],
    requiredPaths: ["scripts/download-cms-homehealth-data.sh"],
  },
  {
    title: "Download CMS hospice datasets",
    command: "bash",
    args: ["scripts/download-cms-hospice-data.sh"],
    requiredPaths: ["scripts/download-cms-hospice-data.sh"],
  },
  {
    title: "Download California ALF licensing feed",
    command: "bash",
    args: ["scripts/download-alf-ca.sh"],
    requiredPaths: ["scripts/download-alf-ca.sh"],
  },
  {
    title: "Download Florida ALF licensing feed",
    command: "bash",
    args: ["scripts/download-alf-fl.sh"],
    requiredPaths: ["scripts/download-alf-fl.sh"],
  },
  {
    title: "Download New York ACF licensing feed",
    command: "bash",
    args: ["scripts/download-alf-ny.sh"],
    requiredPaths: ["scripts/download-alf-ny.sh"],
  },
  {
    title: "Download Texas ALF licensing feed",
    command: "bash",
    args: ["scripts/download-alf-tx.sh"],
    requiredPaths: ["scripts/download-alf-tx.sh"],
  },
];

const processTasks: Task[] = [
  {
    title: "Process CMS nursing-home quality data",
    command: "pnpm",
    args: ["tsx", "scripts/process-quality-data.ts"],
    requiredPaths: ["scripts/process-quality-data.ts"],
  },
  {
    title: "Process CMS home health quality data",
    command: "pnpm",
    args: ["tsx", "scripts/process-homehealth-quality.ts"],
    requiredPaths: ["scripts/process-homehealth-quality.ts"],
  },
  {
    title: "Process CMS hospice quality data",
    command: "pnpm",
    args: ["tsx", "scripts/process-hospice-quality.ts"],
    requiredPaths: ["scripts/process-hospice-quality.ts"],
  },
  {
    title: "Process California ALF data",
    command: "pnpm",
    args: ["tsx", "scripts/process-alf-ca.ts"],
    requiredPaths: ["scripts/process-alf-ca.ts"],
  },
  {
    title: "Process Florida ALF data",
    command: "pnpm",
    args: ["tsx", "scripts/process-alf-fl.ts"],
    requiredPaths: ["scripts/process-alf-fl.ts"],
  },
  {
    title: "Process New York ALF data",
    command: "pnpm",
    args: ["tsx", "scripts/process-alf-ny.ts"],
    requiredPaths: ["scripts/process-alf-ny.ts"],
  },
  {
    title: "Process Texas ALF data",
    command: "pnpm",
    args: ["tsx", "scripts/process-alf-tx.ts"],
    requiredPaths: ["scripts/process-alf-tx.ts"],
  },
];

const importTasks: Task[] = [
  {
    title: "Import CMS nursing-home quality data",
    command: "pnpm",
    args: ["tsx", "scripts/import-quality-data.ts"],
    requiredPaths: ["scripts/import-quality-data.ts"],
  },
  {
    title: "Import CMS home health quality data",
    command: "pnpm",
    args: ["tsx", "scripts/import-homehealth-quality.ts"],
    requiredPaths: ["scripts/import-homehealth-quality.ts"],
  },
  {
    title: "Import CMS hospice quality data",
    command: "pnpm",
    args: ["tsx", "scripts/import-hospice-quality.ts"],
    requiredPaths: ["scripts/import-hospice-quality.ts"],
  },
  {
    title: "Match and import ALF records",
    command: "pnpm",
    args: ["tsx", "scripts/match-alf-to-resources.ts"],
    requiredPaths: ["scripts/match-alf-to-resources.ts"],
  },
  {
    title: "Update nursing home staffing metrics",
    command: "pnpm",
    args: ["tsx", "scripts/update-staffing-metrics.ts"],
    requiredPaths: ["scripts/update-staffing-metrics.ts"],
  },
  {
    title: "Normalize facility metrics and update composite scores",
    command: "pnpm",
    args: ["tsx", "scripts/normalize-facility-metrics.ts"],
    requiredPaths: ["scripts/normalize-facility-metrics.ts"],
  },
];

const reportingTasks: Task[] = [
  {
    title: "Export session demand report",
    command: "pnpm",
    args: ["tsx", "scripts/export-demand-report.ts"],
    requiredPaths: ["scripts/export-demand-report.ts"],
  },
];

function main() {
  logHeader(`Starting data refresh${DRY_RUN ? " (DRY RUN)" : ""}`);

  const allTasks = [
    { title: "Download datasets", tasks: downloadTasks },
    { title: "Process data", tasks: processTasks },
    { title: "Import data", tasks: importTasks },
    { title: "Reporting", tasks: reportingTasks },
  ];

  for (const group of allTasks) {
    logHeader(group.title);
    for (const task of group.tasks) {
      try {
        runTask(task);
      } catch (error) {
        console.error(`❌ ${task.title} failed.`);
        throw error;
      }
    }
  }

  logHeader("Data refresh completed successfully");
}

main().catch((error) => {
  console.error("Data refresh failed:", error);
  process.exit(1);
});
