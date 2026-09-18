"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.nativeRuleOperators = void 0;
const value_util_1 = require("../utils/value.util");
function compareNumbers(left, right) {
    const a = (0, value_util_1.toNumber)(left);
    const b = (0, value_util_1.toNumber)(right);
    if (a === null || b === null)
        return null;
    return a - b;
}
function createComparisonOperator(operator, compare) {
    return {
        operator,
        evaluate(left, condition) {
            return compare(left, condition.value);
        },
    };
}
exports.nativeRuleOperators = [
    {
        operator: "equals",
        evaluate(left, condition) {
            return (0, value_util_1.normalizeComparable)(left) === (0, value_util_1.normalizeComparable)(condition.value);
        },
    },
    {
        operator: "notEquals",
        evaluate(left, condition) {
            return (0, value_util_1.normalizeComparable)(left) !== (0, value_util_1.normalizeComparable)(condition.value);
        },
    },
    createComparisonOperator("greaterThan", (left, right) => {
        const diff = compareNumbers(left, right);
        return diff !== null && diff > 0;
    }),
    createComparisonOperator("greaterOrEqual", (left, right) => {
        const diff = compareNumbers(left, right);
        return diff !== null && diff >= 0;
    }),
    createComparisonOperator("lessThan", (left, right) => {
        const diff = compareNumbers(left, right);
        return diff !== null && diff < 0;
    }),
    createComparisonOperator("lessOrEqual", (left, right) => {
        const diff = compareNumbers(left, right);
        return diff !== null && diff <= 0;
    }),
    {
        operator: "contains",
        evaluate(left, condition) {
            const haystack = (0, value_util_1.toStringValue)(left).toLowerCase();
            const needle = (0, value_util_1.toStringValue)(condition.value).toLowerCase();
            if (!needle)
                return false;
            if (Array.isArray(left)) {
                return left.some((item) => (0, value_util_1.normalizeComparable)(item) === (0, value_util_1.normalizeComparable)(condition.value));
            }
            return haystack.includes(needle);
        },
    },
    {
        operator: "startsWith",
        evaluate(left, condition) {
            return (0, value_util_1.toStringValue)(left)
                .toLowerCase()
                .startsWith((0, value_util_1.toStringValue)(condition.value).toLowerCase());
        },
    },
    {
        operator: "endsWith",
        evaluate(left, condition) {
            return (0, value_util_1.toStringValue)(left)
                .toLowerCase()
                .endsWith((0, value_util_1.toStringValue)(condition.value).toLowerCase());
        },
    },
    {
        operator: "between",
        evaluate(left, condition) {
            const value = (0, value_util_1.toNumber)(left);
            const min = (0, value_util_1.toNumber)(condition.value);
            const max = (0, value_util_1.toNumber)(condition.valueTo);
            if (value === null || min === null || max === null)
                return false;
            const low = Math.min(min, max);
            const high = Math.max(min, max);
            return value >= low && value <= high;
        },
    },
    {
        operator: "in",
        evaluate(left, condition) {
            const values = Array.isArray(condition.value) ? condition.value : [condition.value];
            return values.some((item) => (0, value_util_1.normalizeComparable)(item) === (0, value_util_1.normalizeComparable)(left));
        },
    },
    {
        operator: "notIn",
        evaluate(left, condition) {
            const values = Array.isArray(condition.value) ? condition.value : [condition.value];
            return !values.some((item) => (0, value_util_1.normalizeComparable)(item) === (0, value_util_1.normalizeComparable)(left));
        },
    },
    {
        operator: "isEmpty",
        evaluate(left) {
            return (0, value_util_1.isEmptyValue)(left);
        },
    },
    {
        operator: "isFilled",
        evaluate(left) {
            return !(0, value_util_1.isEmptyValue)(left);
        },
    },
    {
        operator: "exists",
        evaluate(left, _condition, context) {
            void context;
            return left !== undefined && left !== null;
        },
    },
    {
        operator: "notExists",
        evaluate(left, _condition, context) {
            void context;
            return left === undefined || left === null;
        },
    },
];
