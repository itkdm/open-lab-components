#!/usr/bin/env node
"use strict";

const { projectPathsFrom } = require("../_lib/paths");
const { runShellPipeline } = require("../_lib/checks");
const { createReleaseSmokePipeline } = require("../_lib/pipelines");

const PATHS = projectPathsFrom(__dirname);
const pipeline = createReleaseSmokePipeline(PATHS);

runShellPipeline(pipeline.steps, pipeline.successMessage);
