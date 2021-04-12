import * as fs from "fs";
import path from "path";
import * as tmp from "tmp";
import {filterExcludedFiles, scanFile} from "../src/helpers";
import {expect} from "chai";

const testCases: {
    content: string;
    expectedMatches: number[];
    description: string;
}[] = [
    {
        content: "// TODO: foo bar",
        expectedMatches: [0],
        description: "// TODO",
    },
];

describe("scanFile", () => {
    const tmpDir = tmp.dirSync().name;
    process.env.GITHUB_WORKSPACE = tmpDir;
    for (const tc of testCases) {
        it(`scanFile: ${tc.description}`, () => {
            const tempFile = path.basename(tmp.tmpNameSync());
            fs.writeFileSync(`${tmpDir}/${tempFile}`, tc.content);

            const results = scanFile(tempFile, undefined);
            expect(results.map(x => x.lineIndex)).to.have.members(tc.expectedMatches);
            results.forEach(x => expect(x.filePath).to.equal(tempFile));
        });
    }
});

describe("filterFiles", () => {
    it("filters correctly", () => {
        const files = ["README.md", "foo.ts", "__tests__/foo.ts", "dist/index.js"];
        const glob = "?(__tests__|dist)/**";
        const result = filterExcludedFiles(files, glob);
        expect(result).to.have.members(["README.md", "foo.ts"]);
    });
});
