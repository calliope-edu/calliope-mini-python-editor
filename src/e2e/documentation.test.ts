/**
 * (c) 2021, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { App } from "./app";

describe("documentaion", () => {
  const app = new App();
  beforeEach(app.reset.bind(app));
  afterEach(app.screenshot.bind(app));
  afterAll(app.dispose.bind(app));

  it("API toolkit navigation", async () => {
    await app.switchTab("API");
    await app.findDocumentationTopLevelHeading(
      "API",
      "For usage and examples, see"
    );
  });

  it("Copy code and paste in editor", async () => {
    const tab = "Reference";
    await app.selectAllInEditor();
    await app.typeInEditor("# Initial document");
    await app.switchTab(tab);
    await app.selectDocumentationSection("Basics");
    await app.triggerScroll(tab);
    await app.toggleCodeActionButton("Built-in images");
    await app.copyCode();
    await app.pasteToolkitCode();
    await app.findVisibleEditorContents("display.show(Image.HEART)");
  });

  it("Copy code after dropdown choice and paste in editor", async () => {
    const tab = "Reference";
    await app.selectAllInEditor();
    await app.typeInEditor("# Initial document");
    await app.switchTab(tab);
    await app.selectDocumentationSection("Basics");
    await app.triggerScroll(tab);
    await app.selectToolkitDropDownOption(
      "Select image:",
      "happy" // "Image.HAPPY"
    );
    await app.waitForTimeout(500);
    await app.toggleCodeActionButton("Built-in images");
    await app.copyCode();
    await app.pasteToolkitCode();
    await app.findVisibleEditorContents("display.show(Image.HAPPY)");
  });

  it("Insert code via drag and drop", async () => {
    await app.selectAllInEditor();
    await app.typeInEditor("#1\n#2\n#3\n");
    await app.findVisibleEditorContents("#2");
    await app.switchTab("Reference");
    await app.selectDocumentationSection("Basics");

    await app.dragDropCodeEmbed("Scroll text", 2);

    // There's some weird trailing whitespace in this snippet that needs fixing in the content.
    const expected =
      "from calliopemini import *\n\n\ndisplay.scroll('Emma is: ')    \ndisplay.scroll(16)\n#1\n#2\n#3\n";

    await app.findVisibleEditorContents(expected);
  });

  it("Searches and navigates to the first result", async () => {
    await app.searchToolkits("loop");
    await app.selectFirstSearchResult();
    await app.findDocumentationTopLevelHeading(
      "Loops",
      "Execute sets of instructions repeatedly."
    );
  });

  it("Ideas tab navigation", async () => {
    await app.switchTab("Ideas");
    await app.findDocumentationTopLevelHeading(
      "Ideas",
      "Try out these projects, modify them and get inspired"
    );
  });

  it("Select an idea", async () => {
    const ideaName = "Show emotions";
    await app.switchTab("Ideas");
    await app.selectDocumentationIdea(ideaName);
    await app.findDocumentationTopLevelHeading(ideaName);
  });
});
