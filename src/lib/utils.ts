import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Convert camelCase or PascalCase string to spaced words
 * Examples: "ClothesTorso" -> "Clothes Torso", "maskPattern" -> "Mask Pattern"
 */
export function camelCaseToSpaces(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, '$1 $2') // Add space before capital letters
    .replace(/([A-Z])([A-Z][a-z])/g, '$1 $2') // Handle consecutive capitals
    .trim()
}



// exact table from your screenshot (index 0 => level 1)
const totals = [
  0,640,1340,2130,2990,3950,5000,6170,7470,8900,
  10480,12230,14160,16300,18660,21280,24170,27360,30900,34800,
  39120,43900,49180,55020,61480,68620,76520,85250,94900,105580,
  117380,130430,144870,160820,178470,197980,219550,243400,269780,298940,
  331190,366850,406280,449870,498080,551380,610320,675490,747550,827230,
  915340,1012760,1120480,1239590,1371290,1516920,1677940,1855990,2052870,2270560,
  2511270,2777430,3071730,3397150,3756970,4154840,4594770,5081220,5619100,6213850,
  6871490,7596660,8394710,9268520,10223770,11361840,12563780,13892800,15362330,16987240,
  18783950,20770630,22967360,25396360,28082170,31051960,34335740,37966720,41981610,46421000,
  51329760,56757530,62759190,69394400,76729260,84836300,93794960,103692650,114626640,126704730
];

export function getLevelFromTable(xp: number) {
  xp = Math.max(0, xp);
  let lo = 0, hi = totals.length - 1;
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (totals[mid] === xp) {
      return { level: mid + 1, exact: true };
    } else if (totals[mid] < xp) {
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  const level = Math.max(1, hi + 1); // hi is index of largest total <= xp
  return { level: level, exact: false };
}