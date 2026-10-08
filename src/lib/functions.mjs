import Link from './Link.mjs'
import Null from './Null.mjs'
import { getTypeValueKind, isKnownType, isTagType, integerRanges, floatRanges, inRange } from './types.mjs'

export {
    typeDefinitions,
    valueTypes,
    types,
    jsonTypes,
    stringTypes,
    numberTypes,
    getTypeDefinition,
    getTypeValueKind,
    isKnownType,
    isTagType
} from './types.mjs'

if (!Symbol['JSONTag:Type']) {
    Symbol['JSONTag:Type'] = Symbol('@type')
}
if (!Symbol['JSONTag:Attributes']) {
    Symbol['JSONTag:Attributes'] = Symbol('@attributes')
}
if (!Symbol['JSONTag:Null']) {
    Symbol['JSONTag:Null'] = Symbol('@null')
}
// keep reference to original JSON.stringify, in case someone monkeypatches it
const jsonStringify = JSON.stringify

/**
 * Returns false if the string contains an unpaired UTF-16 surrogate, which
 * is not valid Unicode and cannot be encoded as UTF-8, e.g. in a Rust String.
 */
const isWellFormed = typeof String.prototype.isWellFormed === 'function'
    ? (string) => string.isWellFormed()
    : (string) => !/\p{Cs}/u.test(string)

/**
 * Returns the string, throws if it is not valid Unicode
 */
export const assertUnicode = (string) => {
    if (typeof string !== 'string') {
        throw new TypeError('JSONTag expected a string')
    }
    if (!isWellFormed(string)) {
        throw new TypeError('JSONTag cannot stringify '+jsonStringify(string)+', it contains an unpaired UTF-16 surrogate')
    }
    return string
}

/**
 * Returns the string as JSON string literal, throws if it is not valid Unicode
 */
export const quoteString = (string) => jsonStringify(assertUnicode(string))

const numberValueOf = Number.prototype.valueOf
const bigIntValueOf = BigInt.prototype.valueOf

/**
 * Returns the primitive number or bigint of a number, a BigInt, or their
 * wrapper objects, also from another realm. Returns undefined otherwise.
 */
function numericValue(value) {
    if (typeof value === 'number' || typeof value === 'bigint') {
        return value
    }
    if (!value || typeof value !== 'object') {
        return undefined
    }
    try {
        return numberValueOf.call(value)
    } catch {
        // not a Number
    }
    try {
        return bigIntValueOf.call(value)
    } catch {
        // not a BigInt
    }
    return undefined
}

/**
 * Returns true for a bigint, or a BigInt object
 */
export const isBigIntValue = (value) => typeof numericValue(value) === 'bigint'

/**
 * Returns true for 0, -0 and 0n, also as wrapper object. Typed numbers are
 * parsed as wrapper objects, which are always truthy, even for zero.
 */
export const isZero = (value) => {
    const number = numericValue(value)
    return number === 0 || number === 0n
}

/**
 * Returns the JSONTag text of a number or BigInt, without its tag. Throws if
 * the value cannot be written with the given type, so that stringify never
 * writes numbers that the parser, or other implementations, reject.
 */
export const formatNumber = (value, type = getType(value)) => {
    const number = numericValue(value)
    if (typeof number === 'bigint') {
        if (!integerRanges[type]) {
            throw new TypeError('JSONTag cannot stringify BigInt '+number
                + (type==='bigint' ? ', it does not fit in int64 or uint64' : ' as '+type))
        }
        if (!inRange(number, integerRanges[type])) {
            throw new TypeError('JSONTag cannot stringify BigInt '+number+', it is out of range for '+type)
        }
        return number.toString()
    }
    if (typeof number !== 'number') {
        throw new TypeError('JSONTag expected a number or BigInt')
    }
    if (!Number.isFinite(number)) {
        // as JSON.stringify
        return 'null'
    }
    if (integerRanges[type]) {
        if (!Number.isSafeInteger(number)) {
            throw new TypeError('JSONTag cannot stringify '+number+' as '+type+', it is not a safe integer, use a BigInt for larger integers')
        }
        if (!inRange(number, integerRanges[type])) {
            throw new TypeError('JSONTag cannot stringify '+number+', it is out of range for '+type)
        }
    } else if (floatRanges[type]) {
        if (!inRange(number, floatRanges[type])) {
            throw new TypeError('JSONTag cannot stringify '+number+', it is out of range for '+type)
        }
    } else if (Number.isInteger(number) && !Number.isSafeInteger(number)) {
        throw new TypeError('JSONTag cannot stringify '+number+', integers beyond 2^53 may have lost precision, use a BigInt or a float type')
    }
    return jsonStringify(number)
}

/**
 * Throws for objects that would lose all their data when written as an object
 */
function checkObject(value) {
    if (value instanceof Map || value instanceof Set
        || value instanceof WeakMap || value instanceof WeakSet
    ) {
        throw new TypeError('JSONTag cannot stringify a '+value.constructor.name+', convert it first, e.g. with toJSON() or a replacer')
    }
}

export const stringify = (value, replacer=null, space="") => {

    // container -> path node of its first occurrence: { parent, key }
    const paths = new WeakMap()

    let indent = ""
    let gap = ""

    // as JSON.stringify: at most 10 characters of indentation
    if (space instanceof Number) {
        space = Number(space)
    } else if (space instanceof String) {
        space = String(space)
    }
    if (typeof space === "number") {
        indent = " ".repeat(Math.max(0, Math.min(10, Math.trunc(space) || 0)))
    } else if (typeof space === "string") {
        indent = space.slice(0, 10)
        // unlike JSON.stringify, only allow whitespace, so the output can be parsed
        if (/[^ \t\n\r]/.test(indent)) {
            throw new TypeError('JSONTag.stringify: space may only contain spaces, tabs and newlines')
        }
    }

    let propertyList = null
    if (Array.isArray(replacer)) {
        propertyList = [...new Set(replacer
            .filter(key => typeof key === 'string' || typeof key === 'number'
                || key instanceof String || key instanceof Number)
            .map(String)
        )]
    } else if (replacer && typeof replacer !== "function") {
        throw new Error("JSONTag.stringify");
    }

    const join = (parts, mind) => {
        if (!parts.length) {
            return ''
        }
        if (!gap) {
            return parts.join(',')
        }
        return "\n"+gap + parts.join(",\n"+gap) + "\n"+mind
    }

    // node is the path node of obj, the parent of its properties
    const encodeProperties = (obj, node) => {
        let mind = gap
        gap += indent
        const parts = []
        for (const prop of (propertyList ?? Object.keys(obj))) {
            const encoded = str(prop, obj, node)
            if (encoded !== undefined) {
                parts.push(quoteString(prop)+':'+encoded)
            }
        }
        const result = join(parts, mind)
        gap = mind
        return result
    }

    // node is the path node of arr, the parent of its entries
    const encodeEntries = (arr, node) => {
        let mind = gap
        gap += indent
        const parts = []
        for (let i=0; i<arr.length; i++) {
            const encoded = str(i, arr, node)
            parts.push(encoded === undefined ? 'null' : encoded)
        }
        const result = join(parts, mind)
        gap = mind
        return result
    }

    /**
     * Returns the JSONTag text for holder[key], or undefined if the value
     * must be skipped: undefined, functions and symbols. parent is the path
     * node of holder, or null for the root.
     */
    const str = (key, holder, parent) => {
        const original = holder[key]
        let value = original
        if (value instanceof Date) {
            value = dateToJSONTag(value)
        } else if (value && typeof value === 'object' && !isNull(value)) {
            if (typeof value.toJSONTag == 'function') {
                value = value.toJSONTag(String(key))
            } else if (typeof value.toJSON == 'function') {
                value = toJSONValue(value, String(key))
            }
        }
        const converted = value
        if (typeof replacer === 'function') {
            value = replacer.call(holder, String(key), value)
        }
        if (value === undefined || typeof value === 'function' || typeof value === 'symbol') {
            return undefined
        }
        if (value === null) {
            return 'null'
        }
        if (typeof value === 'bigint' || value instanceof BigInt) {
            return getTypeString(value) + formatNumber(value, getType(value))
        }
        if (typeof value === 'string') {
            return quoteString(value)
        }
        if (typeof value === 'number') {
            return formatNumber(value, 'number')
        }
        if (typeof value !== 'object') {
            return jsonStringify(value)
        }
        if (isNull(value)) {
            return getTypeString(value)+'null'
        }
        const isArray = Array.isArray(value)
        if (isArray || getType(value) === 'object') {
            if (!isArray) {
                checkObject(value)
            }
            // repeated reference: link to the first occurrence
            let first = paths.get(value)
            if (!first && value === converted && original !== converted) {
                first = paths.get(original)
            }
            if (first) {
                return '<link>'+quoteString(getAttribute(value, 'id') ?? pointer(first))
            }
            const node = { parent, key }
            paths.set(value, node)
            if (value === converted && original !== converted
                && original && typeof original === 'object'
            ) {
                paths.set(original, node)
            }
            return getTypeString(value) + (isArray
                ? '['+encodeEntries(value, node)+']'
                : '{'+encodeProperties(value, node)+'}')
        }
        const type = getType(value)
        switch (getTypeValueKind(type)) {
            case 'string':
                return getTypeString(value) + quoteString(''+value)
            case 'number':
                return getTypeString(value) + formatNumber(value, type)
            case 'boolean':
                return getTypeString(value) + jsonStringify(value)
            default:
                throw new TypeError('JSONTag cannot stringify a value of type '+type)
        }
    }

    return str("", {"": value}, null)
}

/**
 * Returns the path link for a path node: a JSON Pointer (RFC 6901) prefixed
 * with "#!". The root is "#!", root.people[3] is "#!/people/3".
 */
function pointer(node) {
    if (node.pointer) {
        return node.pointer
    }
    const segments = []
    for (let n = node; n.parent; n = n.parent) {
        segments.push(String(n.key).replace(/~/g, '~0').replace(/\//g, '~1'))
    }
    node.pointer = segments.length ? '#!/'+segments.reverse().join('/') : '#!'
    return node.pointer
}

function dateToJSONTag(date) {
    let result
    if (isNaN(date.getTime())) {
        result = new Null()
    } else {
        // years outside 0 to 9999 are written as expanded years, e.g. +010000
        result = new String(date.toISOString())
    }
    setType(result, 'datetime')
    setAttributes(result, getAttributes(date))
    return result
}

/**
 * Calls value.toJSON(key) and keeps the attributes of value, if any.
 */
function toJSONValue(value, key) {
    const jsonValue = value.toJSON(key)
    const attributes = getAttributes(value)
    if (!Object.keys(attributes).length || jsonValue === undefined) {
        return jsonValue
    }
    let result = jsonValue
    if (jsonValue === null) {
        result = new Null()
    } else if (typeof jsonValue === 'string') {
        result = new String(jsonValue)
    } else if (typeof jsonValue === 'number') {
        result = new Number(jsonValue)
    } else if (typeof jsonValue !== 'object') {
        throw new TypeError('JSONTag cannot add attributes to the '+(typeof jsonValue)+' returned by toJSON()')
    }
    setAttributes(result, attributes)
    return result
}

export const isNull = (v) => {
    return (v === null) || v?.[Symbol['JSONTag:Null']]==true
}

export const getType = (obj) => {
    let type = typeof obj
    if (obj && type == 'object' 
        && (obj instanceof String || obj instanceof Number || obj instanceof BigInt || isNull(obj))
        && (typeof obj[Symbol['JSONTag:Type']] != 'undefined') 
    ) {
        type = obj[Symbol['JSONTag:Type']]
    } else if (type == 'bigint' || obj instanceof BigInt) {
        // the type a BigInt without explicit type is written as
        const big = BigInt(obj.valueOf())
        if (inRange(big, integerRanges.int64)) {
            type = 'int64'
        } else if (inRange(big, integerRanges.uint64)) {
            type = 'uint64'
        } else {
            type = 'bigint'
        }
    } else if (Array.isArray(obj)) {
        type = 'array'
    } else if (obj instanceof String) {
        type = 'string'
    } else if (obj instanceof Number) {
        type = 'number'
    } else if (obj instanceof Boolean) {
        type = 'boolean'
    } else if (obj instanceof Link) {
        type = 'link'
    }
    return type
}

export const setType = (obj, type) => {
    if (!obj || typeof obj !== 'object') {
        throw new TypeError('JSONTag can only set type of objects, convert literals to objects first')
    }
    if (!isKnownType(type)) {
        throw new TypeError('unknown type '+type)
    }
    if (!isTagType(type)) {
        throw new TypeError('JSONTag cannot set type "'+type+'"')
    }
    const kind = getTypeValueKind(type)
    if (isNull(obj)) {
        // null can have any type
        obj[Symbol['JSONTag:Type']] = type
    } else if (Array.isArray(obj)) {
        if (type !== 'array') {
            throw new TypeError('JSONTag can only set type "array" on an array')
        }
    } else if (obj instanceof Link) {
        if (type !== 'link') {
            throw new TypeError('JSONTag can only set type "link" on a Link')
        }
    } else if (obj instanceof String) {
        if (kind !== 'string') {
            throw new TypeError('JSONTag cannot set type "'+type+'" on a string')
        }
        obj[Symbol['JSONTag:Type']] = type
    } else if (obj instanceof Number) {
        if (kind !== 'number') {
            throw new TypeError('JSONTag cannot set type "'+type+'" on a number')
        }
        obj[Symbol['JSONTag:Type']] = type
    } else if (obj instanceof BigInt) {
        if (!integerRanges[type]) {
            throw new TypeError('JSONTag cannot set type "'+type+'" on a BigInt')
        }
        obj[Symbol['JSONTag:Type']] = type
    } else if (obj instanceof Boolean) {
        throw new TypeError('JSONTag cannot set type "'+type+'" on a boolean')
    } else if (type !== 'object') {
        throw new TypeError('JSONTag can only set type "object" on an object')
    }
}

export const setAttribute = (obj, attr, value) => {
    if (!obj || typeof obj !== 'object') {
        throw new TypeError('JSONTag can only add attributes to objects, convert literals to objects first')
    }
    if (Array.isArray(value)) {
        value = value.join(' ')
    }
    if (typeof value !== 'string') {
        throw new TypeError('attribute values must be a string or an array of strings')
    }
    if (value.indexOf('"')!==-1) {
        throw new TypeError('attribute values must not contain " character')
    }
    if (value.indexOf(' ')!==-1) {
        value = value.split(" ")
    }
    const attributes = obj[Symbol['JSONTag:Attributes']] ?? {}
    attributes[attr] = value
    obj[Symbol['JSONTag:Attributes']] = attributes
}

export const setAttributes = (obj, attributes) => {
    if (!obj || typeof obj !== 'object') {
        throw new TypeError('JSONTag can only add attributes to objects, convert literals to objects first')
    }
    if (typeof attributes !== 'object') {
        throw new TypeError('attributes param must be an object')
    }
    Object.keys(attributes).forEach(key => {
        setAttribute(obj, key, attributes[key])
    })
}

export const getAttribute = (obj, attr) => {
    if (!obj || typeof obj != 'object') {
        return undefined
    }
    const attributes = obj[Symbol['JSONTag:Attributes']] ?? {}
    return attributes[attr]
}

export const addAttribute = (obj, attr, value) => {
    if (typeof value !== 'string') {
        throw new TypeError('attribute values must be a string')
    }
    if (value.indexOf('"')!==-1) {
        throw new TypeError('attribute values must not contain " characters')
    }
    if (!obj || typeof obj != 'object') {
        throw new TypeError('JSONTag can only add attributes to objects, convert literals to objects first')
    }
    const attributes = obj[Symbol['JSONTag:Attributes']] ?? {}
    if (typeof attributes[attr] === 'undefined') {
        setAttribute(obj, attr, value)
    } else {
        if (!Array.isArray(attributes[attr])) {
            attributes[attr] = [ attributes[attr] ]
        }
        if (value.indexOf(' ')!==-1) {
            value = value.split(" ")
        } else {
            value = [ value ]
        }
        attributes[attr] = attributes[attr].concat(value)
        obj[Symbol['JSONTag:Attributes']] = attributes
    }
}

export const removeAttribute = (obj, attr) => {
    if (!obj || typeof obj != 'object') {
        return
    }
    const attributes = obj[Symbol['JSONTag:Attributes']]
    if ( typeof attributes?.[attr] !== 'undefined') {
        delete attributes[attr]
    }
}

export const getAttributes = (obj) => {
    if (!obj || typeof obj != 'object') {
        return {}
    }
    const attributes = obj[Symbol['JSONTag:Attributes']] ?? {}
    return Object.assign({},attributes)
}

// attribute values are JSON strings, as the parser reads them
const formatAttributes = (attributes) => {
    return Object.entries(attributes)
        .map(([attr, attrValue]) => {
            if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(attr)) {
                throw new TypeError('JSONTag cannot stringify attribute name '+jsonStringify(attr)+', it must start with a letter, followed by letters, digits or _')
            }
            if (Array.isArray(attrValue)) {
                attrValue = attrValue.join(' ')
            }
            return attr+'='+quoteString(attrValue)
        })
        .join(' ')
}

export const getAttributesString = (obj) => {
    return formatAttributes(getAttributes(obj))
}

export const getTypeString = (obj) => {
    let type = getType(obj)
    let attributes = getAttributes(obj)
    let attributesString = formatAttributes(attributes)
    if (type === 'boolean' && attributesString) {
        throw new TypeError('JSONTag cannot stringify attributes on a boolean, booleans cannot be tagged')
    }
    if (!attributesString) {
        if (['object','array','string','number','boolean'].indexOf(type)!==-1) {
            type = ''
        }
    }
    if (type || attributesString) {
        return '<' + [type, attributesString].filter(Boolean).join(' ') + '>'
    } else {
        return '';
    }
}

function shallowClone(o) {
    if (o instanceof Number) {
        return new Number(o)
    }
    if (o instanceof Boolean) {
        return new Boolean(o.valueOf())
    }
    if (o instanceof String) {
        return new String(o)
    }
    if (o instanceof BigInt) {
        return Object(o.valueOf())
    }
    if (Array.isArray(o)) {
        return [ ...o ]
    }
    return { ...o }
}

export const clone = (obj) => {
    let typeString = getTypeString(obj)
    let type = getType(obj)
    let attributes = getAttributes(obj)
    let clone = shallowClone(obj)
    if (typeString) {
        setType(clone, type)
        if (attributes) {
            setAttributes(clone, attributes)
        }
    }
    return clone
}
