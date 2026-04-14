#!/usr/bin/env node
"use strict";

const { projectPathsFrom } = require("../_lib/paths");
const { runNodePipeline, runPrerequisites } = require("../_lib/checks");
const { createRootQualityPipeline } = require("../_lib/pipelines");

const PATHS = projectPathsFrom(__dirname);
const pipeline = createRootQualityPipeline(PATHS);

runPrerequisites(pipeline.prerequisites);
runNodePipeline(pipeline.steps, pipeline.successMessage);
