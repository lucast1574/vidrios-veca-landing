import type {
  Media,
  ProjectInput,
  ProjectSection,
  RichNode,
} from "@veca/content";
export const newSection = (): ProjectSection => ({
  id: crypto.randomUUID(),
  title: "",
  body: { type: "doc", content: [{ type: "paragraph" }] },
  imageIds: [],
});
export function moveSection(
  sections: ProjectSection[],
  id: string,
  direction: -1 | 1,
) {
  const index = sections.findIndex((section) => section.id === id),
    target = index + direction;
  if (index < 0 || target < 0 || target >= sections.length) return sections;
  const result = [...sections];
  [result[index], result[target]] = [result[target], result[index]];
  return result;
}
export function cleanSectionBody(node: RichNode): RichNode {
  return {
    ...node,
    content: node.content
      ?.filter((child) => child.type !== "image")
      .map(cleanSectionBody),
  };
}
export function legacySections(
  project: Pick<ProjectInput, "body" | "images" | "sections">,
): ProjectSection[] {
  if (project.sections?.length) return project.sections;
  // Preserve all text and canonical photos without guessing where a paragraph should split.
  return [
    {
      ...newSection(),
      body: cleanSectionBody(project.body),
      imageIds: project.images.map((image) => image.id),
    },
  ];
}
export function pruneSections(sections: ProjectSection[], images: Media[]) {
  const ids = new Set(images.map((image) => image.id));
  return sections.map((section) => ({
    ...section,
    imageIds: section.imageIds.filter((id) => ids.has(id)),
    body: cleanSectionBody(section.body),
  }));
}
