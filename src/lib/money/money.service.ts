import Decimal from "decimal.js";

Decimal.set({
  precision: 20,
  rounding: Decimal.ROUND_HALF_UP,
});

export const MONEY_SCALE = 2;
export const RATE_SCALE = 4;

export function normalizeMoney(value: Decimal.Value) {
  return new Decimal(value).toDecimalPlaces(MONEY_SCALE, Decimal.ROUND_HALF_UP);
}

export function normalizeRate(value: Decimal.Value) {
  return new Decimal(value).toDecimalPlaces(RATE_SCALE, Decimal.ROUND_HALF_UP);
}

export function sumMoney(values: Decimal.Value[]) {
  return values.reduce<Decimal>((acc, current) => acc.plus(normalizeMoney(current)), new Decimal(0));
}

export function calculateTax(base: Decimal.Value, rate: Decimal.Value) {
  return normalizeMoney(new Decimal(base).mul(new Decimal(rate)).div(100));
}

export function isBalanced(debits: Decimal.Value, credits: Decimal.Value) {
  return normalizeMoney(debits).equals(normalizeMoney(credits));
}
