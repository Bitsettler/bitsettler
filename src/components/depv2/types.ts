// Presentational types that mirror existing calculator shapes
// DO NOT change business logic - these are UI-only types

export type MaterialRow = {
  id: string | number;
  name: string;
  qty: number;
  tier?: number;
  iconSrc?: string;
  skill?: string;
};

export type Group = {
  title: string;
  count: number;
  rows: MaterialRow[];
};

export type SegmentOption = {
  id: string;
  label: string;
};

export type CalculatorState = {
  groupBySkill: boolean;
  tableView: boolean;
  showSteps: boolean;
};
