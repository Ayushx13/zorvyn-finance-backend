const MONEY_SCALE = 100;
const MONEY_EPSILON = 1e-8;

const toNumericValue = (value) => {
  if (value === null || value === undefined || value === "") {
    return value;
  }

  const numericValue = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numericValue) ? numericValue : value;
};

export const hasAtMostTwoDecimalPlaces = (value) => {
  const numericValue = toNumericValue(value);

  if (typeof numericValue !== "number") {
    return false;
  }

  const scaledValue = numericValue * MONEY_SCALE;
  return Math.abs(scaledValue - Math.round(scaledValue)) < MONEY_EPSILON;
};

export const toStoredMoney = (value) => {
  const numericValue = toNumericValue(value);

  if (typeof numericValue !== "number") {
    return value;
  }

  return Math.round(numericValue * MONEY_SCALE);
};

export const normalizeMoney = (value) => {
  const numericValue = toNumericValue(value);

  if (typeof numericValue !== "number") {
    return value;
  }

  return Number(numericValue.toFixed(2));
};

export const fromStoredMoney = (value) => {
  const numericValue = toNumericValue(value);

  if (typeof numericValue !== "number") {
    return value;
  }

  return Number((numericValue / MONEY_SCALE).toFixed(2));
};

export const normalizeStoredMoney = (value, storageFormat = "major") => (
  storageFormat === "minor" ? fromStoredMoney(value) : normalizeMoney(value)
);

export { MONEY_SCALE };
