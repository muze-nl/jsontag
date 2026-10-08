// Compares the current id based links with path based links.
/* global process */
// Run: node prototypes/path-links/bench.mjs
import JSONTag from '../../src/JSONTag.mjs'
import Parser from '../../src/lib/Parser.mjs'
import { stringify as pathStringify } from './stringify-path.mjs'
import PathParser from './PathParser.mjs'

const idStringify = JSONTag.stringify

// the current stringify adds id attributes to its input, so every run gets fresh data
function time(fn, make, runs=10) {
    for (let i=0; i<3; i++) fn(make())
    let total = 0
    for (let i=0; i<runs; i++) {
        const data = make()
        const t = performance.now()
        fn(data)
        total += performance.now() - t
    }
    return (total/runs).toFixed(1)+' ms'
}

function timeParse(P, input, runs=10) {
    for (let i=0; i<3; i++) new P().parse(input)
    const t = performance.now()
    for (let i=0; i<runs; i++) new P().parse(input)
    return ((performance.now()-t)/runs).toFixed(1)+' ms'
}

const mb = s => (s.length/1e6).toFixed(1)+' MB'

function linkStats(s) {
    const links = s.match(/<link>"[^"]*"/g) ?? []
    let depth = 0, maxDepth = 0, inString = false, escaped = false
    for (const ch of s) {
        if (inString) {
            if (escaped) escaped = false
            else if (ch==='\\') escaped = true
            else if (ch==='"') inString = false
        } else if (ch==='"') inString = true
        else if (ch==='{' || ch==='[') maxDepth = Math.max(maxDepth, ++depth)
        else if (ch==='}' || ch===']') depth--
    }
    const avg = links.length ? Math.round(links.reduce((a,l) => a+l.length, 0)/links.length) : 0
    return { links: links.length, avgLink: avg+' bytes', maxDepth }
}

const N = 50000

// 1. a plain tree, no repeated references
const plainTree = () => {
    const people = []
    for (let i=0; i<N; i++) {
        people.push({ name: 'person '+i, age: i%90, tags: ['a','b'], address: { street: 'Main '+i, city: 'X' } })
    }
    return { people }
}

// 2. tree-like sharing: many records point to a small shared list
const sharedAddresses = () => {
    const addresses = []
    for (let i=0; i<1000; i++) addresses.push({ street: 'Main '+i, city: 'X' })
    const people = []
    for (let i=0; i<N; i++) people.push({ name: 'person '+i, age: i%90, address: addresses[i%1000] })
    return { addresses, people }
}

// 3. graph-like data: records point to other records in the same list
const friendGraph = () => {
    const people = []
    for (let i=0; i<N; i++) people.push({ name: 'person '+i })
    for (let i=0; i<N; i++) people[i].friend = people[(i*7919)%N]
    return { people }
}

console.log(`node ${process.version}, ${N} records per dataset\n`)

console.log('1. plain tree (no repeated references)')
console.log('   output identical:', idStringify(plainTree()) === pathStringify(plainTree()))
console.table({
    'stringify': {
        'current (id links)': time(idStringify, plainTree),
        'path links': time(pathStringify, plainTree),
        'JSON.stringify': time(JSON.stringify, plainTree)
    }
})

console.log('2. shared addresses (1000 shared objects, 50000 references)')
const sharedId = idStringify(sharedAddresses())
const sharedPath = pathStringify(sharedAddresses())
console.table({
    'stringify': { 'current (id links)': time(idStringify, sharedAddresses), 'path links': time(pathStringify, sharedAddresses) },
    'parse': { 'current (id links)': timeParse(Parser, sharedId), 'path links': timeParse(PathParser, sharedPath) },
    'size': { 'current (id links)': mb(sharedId), 'path links': mb(sharedPath) },
    'avg link': { 'current (id links)': linkStats(sharedId).avgLink, 'path links': linkStats(sharedPath).avgLink }
})

console.log('3. friend graph (every record links to another record)')
const graphId = idStringify(friendGraph())
const graphPath = pathStringify(friendGraph())
const gi = linkStats(graphId), gp = linkStats(graphPath)
console.table({
    'stringify': { 'current (id links)': time(idStringify, friendGraph, 3), 'path links': time(pathStringify, friendGraph, 3) },
    'parse': { 'current (id links)': timeParse(Parser, graphId, 3), 'path links': timeParse(PathParser, graphPath, 3) },
    'size': { 'current (id links)': mb(graphId), 'path links': mb(graphPath) },
    'avg link': { 'current (id links)': gi.avgLink, 'path links': gp.avgLink },
    'max nesting': { 'current (id links)': gi.maxDepth, 'path links': gp.maxDepth }
})
