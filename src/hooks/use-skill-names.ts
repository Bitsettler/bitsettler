import { useState, useEffect } from 'react';

interface SkillNamesResponse {
  success: boolean;
  data?: {
    skillNames: Record<string, string>;
    count: number;
  };
  error?: string;
}

/**
 * Hook to fetch and cache skill ID→name mappings
 * 
 * Returns skill names mapping and utility functions for converting skill IDs to names
 */
export function useSkillNames() {
  const [skillNames, setSkillNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSkillNames = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch('/api/settlement/skill-names');
        const result: SkillNamesResponse = await response.json();

        if (!result.success) {
          throw new Error(result.error || 'Failed to fetch skill names');
        }

        setSkillNames(result.data?.skillNames || {});
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load skill names');
        console.error('Skill names fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSkillNames();
  }, []);

  /**
   * Convert a skill ID to its human-readable name
   * Falls back to the skill ID if name not found
   */
  const getSkillName = (skillId: string | number): string => {
    const id = String(skillId);
    return skillNames[id] || `Skill ${id}`;
  };

  /**
   * Convert skills object from ID→level to name→level format
   */
  const transformSkillsToNames = (skills: Record<string, number>): Record<string, number> => {
    const transformed: Record<string, number> = {};
    Object.entries(skills).forEach(([skillId, level]) => {
      const skillName = getSkillName(skillId);
      transformed[skillName] = level;
    });
    return transformed;
  };

  /**
   * Get top skills with proper names sorted by level
   */
  const getTopSkillsWithNames = (skills: Record<string, number>, limit = 8): Array<{ name: string; level: number }> => {
    return Object.entries(skills)
      .map(([skillId, level]) => ({
        name: getSkillName(skillId),
        level
      }))
      .sort((a, b) => b.level - a.level)
      .slice(0, limit);
  };

  return {
    skillNames,
    loading,
    error,
    getSkillName,
    transformSkillsToNames,
    getTopSkillsWithNames,
    hasSkillNames: Object.keys(skillNames).length > 0
  };
}