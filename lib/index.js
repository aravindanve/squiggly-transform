"use strict";
exports.__esModule = true;
var POINTER_PATTERN = /^(?:#|[0-9]+)\//;
function typeOf(value) {
    var type = typeof value;
    if (type !== 'object') {
        return type;
    }
    else if (value === null) {
        return 'null';
    }
    else if (Array.isArray(value)) {
        return 'array';
    }
    else {
        return 'object';
    }
}
function isPointer(value) {
    return typeof value === 'string' && POINTER_PATTERN.test(value);
}
function isTransformCustom(value) {
    return typeof value === 'function';
}
function isTransformTuple(value) {
    return typeof value === 'object' &&
        typeof value[0] === 'string' &&
        typeof value[1] === 'function';
}
function isTransformMap(value) {
    return typeof value === 'object' && value !== null;
}
function deepMerge(target, source, options) {
    var keys = Object.keys(source);
    for (var _i = 0, keys_1 = keys; _i < keys_1.length; _i++) {
        var key = keys_1[_i];
        setProperty(target, key, source[key], options);
    }
}
function setProperty(target, key, value, options) {
    if (typeOf(target[key]) === 'object' &&
        typeOf(value) === 'object') {
        deepMerge(target[key], value, options);
    }
    else if (value === undefined) {
        target[key] = options.undefinedToNull
            ? null : undefined;
    }
    else {
        target[key] = value;
    }
}
function getByPointer(pointer, source, parents) {
    var lastSource;
    try {
        var path = pointer.split(/\//g);
        var base = path.shift();
        if (base === '#') {
            lastSource = parents[0];
        }
        else if (+base === 0) {
            lastSource = source;
        }
        else {
            lastSource = parents[parents.length - (+base + 1)];
        }
        for (var i = 0; i < path.length; i++) {
            lastSource = lastSource[path[i]];
        }
    }
    catch (err) {
    }
    return lastSource;
}
function makeTransformItem(key, rule, options) {
    if (rule === true) {
        return function (target, source) {
            return setProperty(target, key, source[key], options);
        };
    }
    else if (isPointer(rule)) {
        return function (target, source, parents) {
            return setProperty(target, key, getByPointer(rule, source, parents), options);
        };
    }
    else if (isTransformCustom(rule)) {
        return function (target, source, parents, path) {
            return setProperty(target, key, rule(source[key], parents, path), options);
        };
    }
    else if (isTransformTuple(rule)) {
        var transformCustom_1 = rule[1];
        return function (target, source, parents, path) {
            var value = getByPointer(rule[0], source, parents);
            setProperty(target, key, transformCustom_1(value, parents, path), options);
            if (options.emptyObjectToNull &&
                !Object.keys(target[key]).length) {
                target[key] = null;
            }
        };
    }
    else if (isTransformMap(rule)) {
        var transform_1 = makeTransform(rule, options);
        return function (target, source, parents, path) {
            return setProperty(target, key, transform_1(source[key], parents.concat(source), path.concat(key)), options);
        };
    }
    else {
        return function (target) {
            return target[key] = rule;
        };
    }
}
function makeTransform(transformMap, options) {
    if (options === void 0) { options = {}; }
    var transformItems = Object.keys(transformMap)
        .map(function (key) { return makeTransformItem(key, transformMap[key], options); });
    return function (source, parents, path) {
        if (parents === void 0) { parents = []; }
        if (path === void 0) { path = []; }
        var target = {};
        source = typeOf(source) === 'object' ? source : {};
        for (var _i = 0, transformItems_1 = transformItems; _i < transformItems_1.length; _i++) {
            var transformItem = transformItems_1[_i];
            try {
                transformItem(target, source, parents, path);
            }
            catch (err) {
                continue;
            }
        }
        return target;
    };
}
exports.makeTransform = makeTransform;
//# sourceMappingURL=index.js.map