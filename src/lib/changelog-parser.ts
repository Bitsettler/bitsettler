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
    const versionSections = content.split(/^## \[([^\]]+)\]/gm).slice(1);
    
    const versions: ChangelogVersion[] = [];
    
    for (let i = 0; i < versionSections.length; i += 2) {
      const versionInfo = versionSections[i];
      const versionContent = versionSections[i + 1] || '';
      
      // Parse version info (e.g., "1.12.2] - Enhanced Safety & Visual Improvements - 2025-01-16")
      const versionMatch = versionInfo.match(/^([^\]]+)\]\s*-\s*(.+?)\s*-\s*(.+)$/);
      if (!versionMatch) continue;
      
      const [, version, title, date] = versionMatch;
      
      // Parse sections (### Added, ### Fixed, etc.)
      const sections = parseVersionSections(versionContent);
      
      versions.push({
        version: version.trim(),
        title: title.trim(),
        date: date.trim(),
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
  const bulletPoints = content.split(/^- \*\*(.+?)\*\*:/gm);
  
  for (let i = 1; i < bulletPoints.length; i += 2) {
    const title = bulletPoints[i].trim();
    const description = bulletPoints[i + 1] || '';
    
    // Parse sub-items (  - **Sub-item**: Description)
    const subItems: string[] = [];
    const subItemMatches = description.matchAll(/^\s+- \*\*(.+?)\*\*:\s*(.+?)(?=\n\s+- |\n\n|$)/gm);
    
    for (const match of subItemMatches) {
      subItems.push(`${match[1]}: ${match[2].trim()}`);
    }
    
    // If no sub-items, use the main description
    if (subItems.length === 0) {
      const cleanDescription = description.replace(/^\s+/gm, '').trim();
      if (cleanDescription) {
        subItems.push(cleanDescription);
      }
    }
    
    items.push({
      title,
      items: subItems
    });
  }
  
  return items;
}
