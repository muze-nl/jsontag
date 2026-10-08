// Shows how the current JSONTag.stringify handles repeated references.
// Run: node prototypes/path-links/probe-current.mjs
import JSONTag from '../../src/JSONTag.mjs'

const show = (name, fn) => {
    try {
        console.log(name+':\n  '+fn())
    } catch(e) {
        console.log(name+':\n  THROWS '+e.constructor.name+': '+e.message)
    }
}

const shared = { a: 1 }
show('shared object', () => JSONTag.stringify({ x: shared, y: shared }))
show('input mutated, attributes of shared object afterwards', () => JSON.stringify(JSONTag.getAttributes(shared)))

const fresh = () => { const d = { z: 1 }; return { a: d, b: d } }
show('equal input, equal output?', () => JSONTag.stringify(fresh()) === JSONTag.stringify(fresh()))

const arr = [1]
arr.push(arr)
show('array cycle', () => JSONTag.stringify(arr))

const sa = [1,2]
show('shared array (identity lost)', () => JSONTag.stringify({ a: sa, b: sa }))

const s = new String('2020-01-01')
JSONTag.setType(s, 'date')
show('shared typed string (duplicate ids)', () => JSONTag.stringify({ a: s, b: s }))

const inner = { v: 1 }
class W { toJSON() { return { p: inner, q: inner } } }
show('object shared via toJSON (dangling link)', () => JSONTag.stringify(new W()))
