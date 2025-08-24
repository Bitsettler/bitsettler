import fs from 'fs';
import path from 'path';

export interface ChangelogItem {
  title: string;
  items: string[];
}

export interface ChangelogVersion {
  version: string;
  title: string;
  date: string;
  description?: string;
  added: ChangelogItem[];
  improved: ChangelogItem[];
  fixed: ChangelogItem[];
  removed: ChangelogItem[];
  enhanced: ChangelogItem[];
  technical: ChangelogItem[];
  changed: ChangelogItem[];
}

export function parseChangelog(): ChangelogVersion[] {
  try {
    const changelogPath = path.join(process.cwd(), 'CHANGELOG.md');
    const content = fs.readFileSync(changelogPath, 'utf-8');
    
    // Split by version headers (## [version])
    const matches = [...content.matchAll(/^## \[([^\]]+)\] - (.+?) - (.+?)$/gm)];
    
    const versions: ChangelogVersion[] = [];
    
    for (let i = 0; i < matches.length; i++) {
      const match = matches[i];
      const version = match[1].trim();
      const title = match[2].trim();
      const date = match[3].trim();
      
      // Find content between this version and the next
      const currentIndex = match.index!;
      const nextMatch = matches[i + 1];
      const nextIndex = nextMatch ? nextMatch.index! : content.length;
      
      const versionContent = content.slice(currentIndex, nextIndex);
      
      // Parse sections (### Added, ### Fixed, etc.)
      const sections = parseVersionSections(versionContent);
      
      versions.push({
        version,
        title,
        date,
        ...sections
      });
    }
    
    return versions;
  } catch (error) {
    console.error('Error parsing changelog:', error);
    return [];
  }
}

function parseVersionSections(content: string) {
  const sections = {
    added: [] as ChangelogItem[],
    improved: [] as ChangelogItem[],
    fixed: [] as ChangelogItem[],
    removed: [] as ChangelogItem[],
    enhanced: [] as ChangelogItem[],
    technical: [] as ChangelogItem[],
    changed: [] as ChangelogItem[]
  };
  
  // Split by section headers (### Section Name)
  const sectionParts = content.split(/^### (.+)$/gm);
  
  for (let i = 1; i < sectionParts.length; i += 2) {
    const sectionName = sectionParts[i].toLowerCase().trim();
    const sectionContent = sectionParts[i + 1] || '';
    
    // Map section names to our structure
    let sectionKey: keyof typeof sections;
    switch (sectionName) {
      case 'added':
        sectionKey = 'added';
        break;
      case 'improved':
      case 'enhanced':
        sectionKey = 'enhanced';
        break;
      case 'fixed':
        sectionKey = 'fixed';
        break;
      case 'removed':
        sectionKey = 'removed';
        break;
      case 'technical':
      case 'technical improvements':
        sectionKey = 'technical';
        break;
      case 'changed':
        sectionKey = 'changed';
        break;
      default:
        continue;
    }
    
    const items = parseSectionItems(sectionContent);
    sections[sectionKey].push(...items);
  }
  
  return sections;
}

function parseSectionItems(content: string): ChangelogItem[] {
  const items: ChangelogItem[] = [];
  
  // Split by main bullet points (- **Title**: Description)
  const lines = content.split('\n');
  let currentItem: ChangelogItem | null = null;
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    // Main bullet point (- **Title**: Description)
    const mainMatch = trimmedLine.match(/^- \*\*(.+?)\*\*:\s*(.*)$/);
    if (mainMatch) {
      // Save previous item if exists
      if (currentItem) {
        items.push(currentItem);
      }
      
      currentItem = {
        title: mainMatch[1].trim(),
        items: []
      };
      
      // Add description if present
      if (mainMatch[2].trim()) {
        currentItem.items.push(mainMatch[2].trim());
      }
      continue;
    }
    
    // Sub-item (  - **Sub-item**: Description)
    const subMatch = trimmedLine.match(/^- \*\*(.+?)\*\*:\s*(.*)$/);
    if (subMatch && currentItem) {
      currentItem.items.push(`${subMatch[1]}: ${subMatch[2].trim()}`);
      continue;
    }
    
    // Regular sub-item (  - Description)
    const regularSubMatch = trimmedLine.match(/^- (.+)$/);
    if (regularSubMatch && currentItem) {
      currentItem.items.push(regularSubMatch[1].trim());
      continue;
    }
    
    // Continuation line (if we have a current item and line has content)
    if (currentItem && trimmedLine && !trimmedLine.startsWith('###') && !trimmedLine.startsWith('##')) {
      if (currentItem.items.length === 0) {
        currentItem.items.push(trimmedLine);
      } else {
        // Append to last item
        currentItem.items[currentItem.items.length - 1] += ' ' + trimmedLine;
      }
    }
  }
  
  // Add the last item
  if (currentItem) {
    items.push(currentItem);
  }
  
  return items;
}
