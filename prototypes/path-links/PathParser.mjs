// Prototype: Parser that resolves path links (<link>"#/json/pointer") while
// parsing. Path links may only point backward: to a completed value, or to a
// container that is still open (a cycle). Both can be resolved immediately
// using a stack of open containers, so no unresolved list or post-pass is
// needed for them. Id links are still handled by the base Parser.
import Parser from '../../src/lib/Parser.mjs'
import * as JSONTag from '../../src/lib/functions.mjs'

export function isPathLink(value)
{
    return value instanceof String
        && JSONTag.getType(value)==='link'
        && value.charAt(0)==='#'
        && (value.length===1 || value.charAt(1)==='/')
}

export default class PathParser extends Parser
{
    // open containers, outermost first: { container, key }
    // key is the property name or index currently being parsed
    stack = []

    parse(input, reviver)
    {
        this.stack = []
        return super.parse(input, reviver)
    }

    resolvePointer(ptr)
    {
        if (!this.stack.length) {
            this.error('Path link outside of a container: '+ptr)
        }
        if (ptr === '#') {
            return this.stack[0].container
        }
        const segs = ptr.slice(2).split('/')
            .map(s => s.replace(/~1/g,'/').replace(/~0/g,'~'))
        let node = this.stack[0].container
        for (let i=0; i<segs.length; i++) {
            const open = this.stack[i]
            if (open && open.container===node
                && String(open.key)===segs[i]
                && this.stack[i+1]
            ) {
                // still open ancestor, not yet assigned to its parent
                node = this.stack[i+1].container
            } else {
                // completed value
                node = node?.[segs[i]]
            }
            if (node === undefined) {
                this.error('Unresolvable or forward path link '+ptr)
            }
        }
        return node
    }

    value(isRoot=false)
    {
        const result = super.value(isRoot)
        if (isPathLink(result)) {
            return this.resolvePointer(''+result)
        }
        return result
    }

    array()
    {
        let item, array = []
        const frame = { container: array, key: 0 }
        this.stack.push(frame)
        this.next('[')
        this.whitespace()
        if (this.ch===']') {
            this.next(']')
            this.stack.pop()
            return array
        }
        while(this.ch) {
            frame.key = array.length
            item = this.value()
            this.checkUnresolved(item, array, array.length)
            array.push(item)
            this.whitespace()
            if (this.ch===']') {
                this.next(']')
                this.stack.pop()
                return array
            }
            this.next(',')
            this.whitespace()
        }
        this.error("Input stopped early")
    }

    object()
    {
        let key, val, object={}
        const frame = { container: object, key: null }
        this.stack.push(frame)
        this.next('{')
        this.whitespace()
        if (this.ch==='}') {
            this.next('}')
            this.stack.pop()
            return object
        }
        while(this.ch) {
            key = this.string()
            if (key==='__proto__') {
                this.error("Attempt at prototype pollution")
            }
            this.whitespace()
            this.next(':')
            frame.key = key
            val = this.value()
            object[key] = val
            this.checkUnresolved(val, object, key)
            this.whitespace()
            if (this.ch==='}') {
                this.next('}')
                this.stack.pop()
                return object
            }
            this.next(',')
            this.whitespace()
        }
        this.error("Input stopped early")
    }
}
