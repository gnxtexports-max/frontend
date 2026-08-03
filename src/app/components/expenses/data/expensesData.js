export const HIGH_EXPENSE_THRESHOLD = 5000;

export const DISPATCH_EXPENSE_TYPES = [
  "Fuel",
  "Toll",
  "Driver",
  "Market Vehicle",
  "Overtime",
  "Miscellaneous",
  "MVD Penalty",
];

export const MAINTENANCE_EXPENSE_TYPES = [
  "Insurance",
  "Pollution",
  "Fitness",
  "Tax",
  "Tyre Purchase",
  "Repair",
  "Miscellaneous",
];

export const expenseTypes = [
  ...new Set([...DISPATCH_EXPENSE_TYPES, ...MAINTENANCE_EXPENSE_TYPES]),
];

export const ITEMS_PER_PAGE = 8;
