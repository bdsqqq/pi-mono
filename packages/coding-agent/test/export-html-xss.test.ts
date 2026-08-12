import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("export HTML markdown URL sanitization", () => {
	const templateJs = readFileSync(new URL("../src/core/export-html/template.js", import.meta.url), "utf-8");

	it("uses a scheme allow-list for links and images", () => {
		expect(templateJs).toMatch(/link\s*\(\s*token\s*\)/);
		expect(templateJs).toMatch(/image\s*\(\s*token\s*\)/);
		expect(templateJs.match(/sanitizeMarkdownUrl\(token\.href\)/g)).toHaveLength(2);
		expect(templateJs).toMatch(/\^\(https\?\|mailto\|tel\|ftp\)/);
	});

	it("strips C0 controls before checking and emitting markdown URLs", () => {
		expect(templateJs).toContain("replace(/[\\x00-\\x1f\\x7f]/g, '')");
	});

	it("escapes allowed link and image attributes", () => {
		expect(templateJs).toMatch(/escapeHtml\(href\)/);
		expect(templateJs).toMatch(/escapeHtml\(token\.title\)/);
		expect(templateJs).toMatch(/escapeHtml\(token\.text \|\| ''\)/);
	});
});
