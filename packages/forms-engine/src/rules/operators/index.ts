import type { RuleCondition, RuleContext, RuleOperatorHandler } from "../types/index"
import { isEmptyValue, normalizeComparable, toNumber, toStringValue } from "../utils/value.util"

function compareNumbers(left: unknown, right: unknown): number | null {
  const a = toNumber(left)
  const b = toNumber(right)
  if (a === null || b === null) return null
  return a - b
}

function createComparisonOperator(
  operator: RuleCondition["operator"],
  compare: (left: unknown, right: unknown) => boolean,
): RuleOperatorHandler {
  return {
    operator,
    evaluate(left, condition) {
      return compare(left, condition.value)
    },
  }
}

export const nativeRuleOperators: RuleOperatorHandler[] = [
  {
    operator: "equals",
    evaluate(left, condition) {
      return normalizeComparable(left) === normalizeComparable(condition.value)
    },
  },
  {
    operator: "notEquals",
    evaluate(left, condition) {
      return normalizeComparable(left) !== normalizeComparable(condition.value)
    },
  },
  createComparisonOperator("greaterThan", (left, right) => {
    const diff = compareNumbers(left, right)
    return diff !== null && diff > 0
  }),
  createComparisonOperator("greaterOrEqual", (left, right) => {
    const diff = compareNumbers(left, right)
    return diff !== null && diff >= 0
  }),
  createComparisonOperator("lessThan", (left, right) => {
    const diff = compareNumbers(left, right)
    return diff !== null && diff < 0
  }),
  createComparisonOperator("lessOrEqual", (left, right) => {
    const diff = compareNumbers(left, right)
    return diff !== null && diff <= 0
  }),
  {
    operator: "contains",
    evaluate(left, condition) {
      const haystack = toStringValue(left).toLowerCase()
      const needle = toStringValue(condition.value).toLowerCase()
      if (!needle) return false
      if (Array.isArray(left)) {
        return left.some(
          (item) => normalizeComparable(item) === normalizeComparable(condition.value),
        )
      }
      return haystack.includes(needle)
    },
  },
  {
    operator: "startsWith",
    evaluate(left, condition) {
      return toStringValue(left)
        .toLowerCase()
        .startsWith(toStringValue(condition.value).toLowerCase())
    },
  },
  {
    operator: "endsWith",
    evaluate(left, condition) {
      return toStringValue(left)
        .toLowerCase()
        .endsWith(toStringValue(condition.value).toLowerCase())
    },
  },
  {
    operator: "between",
    evaluate(left, condition) {
      const value = toNumber(left)
      const min = toNumber(condition.value)
      const max = toNumber(condition.valueTo)
      if (value === null || min === null || max === null) return false
      const low = Math.min(min, max)
      const high = Math.max(min, max)
      return value >= low && value <= high
    },
  },
  {
    operator: "in",
    evaluate(left, condition) {
      const values = Array.isArray(condition.value) ? condition.value : [condition.value]
      return values.some((item) => normalizeComparable(item) === normalizeComparable(left))
    },
  },
  {
    operator: "notIn",
    evaluate(left, condition) {
      const values = Array.isArray(condition.value) ? condition.value : [condition.value]
      return !values.some((item) => normalizeComparable(item) === normalizeComparable(left))
    },
  },
  {
    operator: "isEmpty",
    evaluate(left) {
      return isEmptyValue(left)
    },
  },
  {
    operator: "isFilled",
    evaluate(left) {
      return !isEmptyValue(left)
    },
  },
  {
    operator: "exists",
    evaluate(left, _condition, context) {
      void context
      return left !== undefined && left !== null
    },
  },
  {
    operator: "notExists",
    evaluate(left, _condition, context) {
      void context
      return left === undefined || left === null
    },
  },
]
