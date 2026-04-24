#!/usr/bin/env node
// Combines individual student project JSON files into a single projects.json array.
// Usage: node combine.js <input_dir> [output_file]
//   input_dir   - directory containing one JSON file per student (default: ./student-projects)
//   output_file - path to write combined output (default: ./projects.json)

import { readFileSync, writeFileSync, readdirSync } from "fs";
import { join, resolve } from "path";

const inputDir = resolve(process.argv[2] ?? "./student-projects");
const outputFile = resolve(process.argv[3] ?? "./projects.json");

const files = readdirSync(inputDir).filter((f) => f.endsWith(".json"));

if (files.length === 0) {
  console.error(`No .json files found in ${inputDir}`);
  process.exit(1);
}

const projects = files.map((f) => {
  const filePath = join(inputDir, f);
  try {
    return JSON.parse(readFileSync(filePath, "utf8"));
  } catch (err) {
    console.error(`Failed to parse ${filePath}: ${err.message}`);
    process.exit(1);
  }
});

writeFileSync(outputFile, JSON.stringify(projects, null, 2));
console.log(`Combined ${projects.length} project(s) → ${outputFile}`);
