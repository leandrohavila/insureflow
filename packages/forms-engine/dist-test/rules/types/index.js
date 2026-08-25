"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RULE_ACTION_TYPES = exports.RULE_OPERATORS = void 0;
exports.RULE_OPERATORS = [
    "equals",
    "notEquals",
    "greaterThan",
    "greaterOrEqual",
    "lessThan",
    "lessOrEqual",
    "contains",
    "startsWith",
    "endsWith",
    "between",
    "in",
    "notIn",
    "isEmpty",
    "isFilled",
    "exists",
    "notExists",
];
exports.RULE_ACTION_TYPES = [
    "showField",
    "hideField",
    "requireField",
    "optionalField",
    "enableField",
    "disableField",
    "setValue",
    "clearValue",
    "showSection",
    "hideSection",
    "jumpToSection",
];
