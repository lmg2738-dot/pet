import type { AihubDatasetItem, AihubFileItem } from "@/lib/aihub/types";

const LIST_ITEM_REGEX = /^(\d+),\s*(.+)$/;

export function parseDatasetList(output: string): AihubDatasetItem[] {
  const items: AihubDatasetItem[] = [];

  for (const line of output.split("\n")) {
    const trimmed = line.trim();
    const match = trimmed.match(LIST_ITEM_REGEX);
    if (match) {
      items.push({
        key: parseInt(match[1], 10),
        title: match[2].trim(),
      });
    }
  }

  return items;
}

const FILE_LINE_REGEX =
  /[├└│─\s]*([^|]+\.(?:zip|tar|gz|7z|rar|json|xml|csv|txt|jpg|png|mp4|avi))\s*\|\s*([^|]+?)\s*\|\s*(\d+)\s*$/i;

export function parseFileList(output: string): AihubFileItem[] {
  const items: AihubFileItem[] = [];

  for (const line of output.split("\n")) {
    const match = line.match(FILE_LINE_REGEX);
    if (match) {
      const name = match[1].trim();
      items.push({
        path: name,
        name: name.split("/").pop() ?? name,
        size: match[2].trim(),
        filekey: parseInt(match[3], 10),
      });
    }
  }

  return items;
}

export function filterDatasets(
  items: AihubDatasetItem[],
  query?: string
): AihubDatasetItem[] {
  if (!query?.trim()) return items;
  const q = query.trim().toLowerCase();
  return items.filter(
    (item) =>
      item.title.toLowerCase().includes(q) ||
      String(item.key).includes(q)
  );
}
