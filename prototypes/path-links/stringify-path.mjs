// Prototype: JSONTag.stringify with path based links.
// Identical to src/lib/functions.mjs stringify, except for how repeated
// references are handled: instead of a pre-walk that assigns random ids, each
// container remembers where it was first written, and later references are
// written as a JSON Pointer in a URI fragment, e.g. <link>"#/people/3".
import {
    getType,
    getAttribute,
    getAttributes,
    setAttributes,
    setType,
    getTypeString
} from '../../src/lib/functions.mjs'
import { getTypeValueKind } from '../../src/lib/types.mjs'

const jsonStringify = JSON.stringify

export const stringify = (value, replacer=null, space="") => {

    // container -> path node of its first occurrence
    const paths = new WeakMap()
    // path node of the container currently being written: { parent, key }
    let current = null

    // RFC 6901 JSON Pointer as URI fragment, only built when a link is written
    const pointer = (node) => {
        if (node.ptr) {
            return node.ptr
        }
        let segs = []
        for (let n = node; n && n.parent; n = n.parent) {
            segs.push(String(n.key).replace(/~/g,'~0').replace(/\//g,'~1'))
        }
        node.ptr = segs.length ? '#/'+segs.reverse().join('/') : '#'
        return node.ptr
    }

    let indent = ""
    let gap = ""

    if (typeof space === "number") {
        indent += " ".repeat(space)
    } else if (typeof space === "string") {
        indent = space
    }

    if (replacer && typeof replacer !== "function" && (
        typeof replacer !== "object"
        || typeof replacer.length !== "number"
    )) {
        throw new Error("JSONTag.stringify");
    }

    const encodeProperties = (obj) => {
        let mind = gap
        gap += indent
        let gapstart = ""
        let gapend = ""
        let keys = Object.keys(obj)
        if (Array.isArray(replacer)) {
            keys = keys.filter(key => replacer.indexOf(key)!==-1)
        }
        if (gap) {
            gapstart ="\n"+gap
            gapend = "\n"+mind
        }
        let result = gapstart+keys.map(prop => {
            if (obj[prop]===undefined) {
                return null
            }
            return jsonStringify(prop)+':'+str(prop, obj)
        }).filter(Boolean).join(","+gapstart)+gapend
        gap = mind
        return result
    }

    const encodeEntries = (arr) => {
        let mind = gap
        gap += indent
        let gapstart = ""
        let gapend = ""
        if (gap) {
            gapstart = "\n"+gap
            gapend = "\n"+mind
        }
        let result = gapstart+arr.map((value,index) => {
            return str(index, arr)
        }).join(","+gapstart)+gapend
        gap = mind
        return result
    }

    const str = (key, holder) => {
        let value = holder[key]
        if (typeof replacer === 'function' && key!=='') {
            value = replacer.call(holder, key, value)
        }
        if (typeof value === 'undefined' || value === null) {
            return 'null'
        }
        const saved = current
        let node = null
        if (typeof value === 'object') {
            const first = paths.get(value)
            if (first) {
                // existing ids win: stable across edits and documents
                return '<link>'+jsonStringify(getAttribute(value, 'id') ?? pointer(first))
            }
            const kind = getType(value)
            if (kind === 'object' || kind === 'array') {
                // the root has no parent node, so its pointer is "#"
                node = { parent: current, key }
                paths.set(value, node)
                current = node
            }
        }
        try {
            if (typeof value.toJSONTag == 'function') {
                value = value.toJSONTag()
            } else if (typeof value.toJSON == 'function') {
                let type = getType(value)
                let attr = getAttributes(value)
                let jsonValue = value.toJSON()
                if (typeof jsonValue == 'string') {
                    value = new String(jsonValue) // convert to object so we can add type/attributes
                } else if (typeof jsonValue == 'number') {
                    value = new Number(jsonValue) // convert to object so we can add type/attributes
                } else if (jsonValue==null) { // null cannot have types/attributes, so do this by hand
                    if (value!==null) {
                        return getTypeString(value)+'null'
                    }
                    return 'null'
                } else { // use the value from toJSON()
                    value = jsonValue
                    // objects shared via toJSON() are tracked too
                    if (node && value && typeof value === 'object' && !paths.has(value)) {
                        paths.set(value, node)
                    }
                }
                if (attr) {
                    setAttributes(value, attr)
                }
                if (type) {
                    setType(value, type)
                }
            }
            if (Array.isArray(value)) {
                return getTypeString(value) + "["+encodeEntries(value)+"]"
            } else if (value instanceof Object) {
                const type = getType(value)
                switch (getTypeValueKind(type)) {
                    case 'string':
                        return getTypeString(value) + jsonStringify(''+value, replacer, space)
                    case 'boolean':
                    case 'number':
                        return getTypeString(value) + jsonStringify(value, replacer, space)
                    case 'array':
                        return getTypeString(value) + '[' + encodeEntries(value) + ']'
                    case 'object':
                        return getTypeString(value) + '{' + encodeProperties(value) + '}'
                    default:
                        throw new Error(type+' type not yet implemented')
                }
            } else {
                return jsonStringify(value, replacer, space)
            }
        } finally {
            current = saved
        }
    }

    return str("", {"": value})
}
