const ACCEPTED_EXTENSIONS = [".md", ".markdown"];

export function isMarkdownFile(file: File): boolean {
  const name = file.name.toLowerCase();
  return ACCEPTED_EXTENSIONS.some((ext) => name.endsWith(ext));
}
