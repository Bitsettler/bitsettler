export type Rarity = "common" | "uncommon" | "rare" | "epic" | "legendary";
export type Category =
  | "items"
  | "cargo"
  | "creatures"
  | "resources"
  | "structures";

export interface GameItem {
  name: string;
  slug: string;
  tier: number;
  rarity: Rarity;
  category: Category;
}

export interface Profession {
  name: string;
  level: number;
}

export interface Tool {
  name: string;
  tier: number;
}

export interface Building {
  name: string;
  tier: number;
}

export interface RecipeOutput {
  item: string; // slug of the item
  qty: number;
}

export interface Recipe {
  category: "craft" | "gather";
  requirements: {
    profession: Profession;
    tool: Tool;
    building: Building;
    materials: string[]; // array of item slugs
  };
  output: RecipeOutput[];
}
