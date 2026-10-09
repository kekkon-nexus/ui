import { glob } from "node:fs/promises";

import { $, argv } from "bun";

const input = argv[2];
if (!input) throw new Error("usage: bun run bump <version|major|minor|patch>");

const status = await $`git status --porcelain`.text();
if (status.trim()) throw new Error("working directory not clean");

const root = await $`bun pm version ${input} --no-git-tag-version`.text();
const version = root.trimEnd().slice(1); // remove v and trailing newlines

for await (const dir of glob("packages/*"))
	await $`bun pm pkg set version=${version} --cwd ${dir}`;
await $`bun install`;
await $`git commit -am ${`:bookmark: build(release): ${version}`}`;
await $`git tag -m ${`:bookmark: build(release): ${version}`} v${version}`;
