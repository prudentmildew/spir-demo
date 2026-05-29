// Artifact counts shown on the Metodikk page. The values are computed at build
// time from the repo (see vite.config.ts `define`) so they stay exact as the
// project grows, with no hand-maintenance and no file contents pulled into the
// bundle — only the tallies. The globals below are replaced by literals at build.
declare const __ADR_COUNT__: number;
declare const __PROTOTYPE_COUNT__: number;
declare const __EVAL_RUN_COUNT__: number;
declare const __TEST_FILE_COUNT__: number;

export const ADR_COUNT = __ADR_COUNT__;
export const PROTOTYPE_COUNT = __PROTOTYPE_COUNT__;
export const EVAL_RUN_COUNT = __EVAL_RUN_COUNT__;
export const TEST_FILE_COUNT = __TEST_FILE_COUNT__;
