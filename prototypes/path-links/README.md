# Prototype: path based links

> **Status:** implemented in `src/` with the `#!` prefix instead of `#`, e.g.
> `<link>"#!/people/3"`, with the root as `<link>"#!"`. The implementation
> resolves path links after the reviver, not while parsing. Since
> `JSONTag.stringify` now writes path links itself, the "current (id links)"
> column of `bench.mjs` no longer measures id links. The results below were
> measured before the change.

This prototype explores a different way for `JSONTag.stringify` to write
repeated references: instead of assigning ids, a repeated reference becomes a
link to the *path* where the object was first written.

```
{"x":{"a":1},"y":<link>"#/x"}
```

The goal is to make JSONTag writable and readable in a single pass, as a step
towards streaming, and to see what it does to performance.

**Summary:** it works, and it fixes several bugs in the current
implementation. For plain trees and tree-like sharing it is as fast or faster
and produces smaller output. For graph-shaped data the links become very long,
because a path grows with the nesting depth of its target. That is the main
trade-off.

## The problem with the current approach

The current `stringify` (`src/lib/functions.mjs`) needs to put an `id`
attribute on the *first* occurrence of an object, but it can only know an
object is shared when it sees the *second* occurrence. So it first walks the
whole graph (`createIds`), assigns a random UUID to every object it sees twice,
and only then writes the output. That pre-walk makes streaming output
impossible.

It also causes these problems (see `probe-current.mjs`):

| Problem | Example output |
|---|---|
| Input is mutated: shared objects get an `id` attribute | `getAttributes(shared)` → `{"id":"192dbf3d-…"}` |
| Output is not deterministic: equal input, different random ids | `false` |
| Array cycles overflow the stack: arrays are not tracked | `RangeError: Maximum call stack size exceeded` |
| Shared arrays lose their identity | `{"a":[1,2],"b":[1,2]}` |
| Shared typed strings get the same id twice | `{"a":<date id="91bb…">"2020-01-01","b":<date id="91bb…">"2020-01-01"}` |
| Objects shared via `toJSON()` produce a dangling link: the pre-walk never sees them, so the first copy is written without an id | `{"p":{"v":1},"q":<link>"73c8…"}` |

## Design

### Writing

`stringify` writes depth first. That means that when an object is seen for a
second time, its first occurrence has already been written, or is still being
written (a cycle back to an ancestor). Either way its path is already known,
so the link can be written at once: no pre-walk is needed.

- A `WeakMap` maps each object and array to a small path node
  `{ parent, key }` for its first occurrence. Nodes are only created for
  containers, not for scalar values.
- The pointer string is only built when a link is actually written, and is
  cached on the node.
- If an object already has an `id` attribute, the link uses that id, as
  before. Ids are stable across edits and documents, so they win.
- Objects returned by `toJSON()` are tracked as well.
- Only objects and arrays are tracked. A shared typed string, such as a
  `<date>`, is simply written twice.

### Link syntax

A path link is a [JSON Pointer (RFC 6901)](https://www.rfc-editor.org/rfc/rfc6901)
in a URI fragment, inside a normal `<link>`:

```
<link>"#"                 the root
<link>"#/people/3"        root.people[3]
<link>"#/a~1b/c~0d"       root["a/b"]["c~d"]
```

- `/` in a key is escaped as `~1` and `~` as `~0`.
- It fits the idea that a `<link>` value is a URI: resolved against
  `baseURL`, `https://example.org/doc.json#/people/3` is a valid IRI. This could
  give objects without an `id` a stable identifier in the linked data profile,
  instead of a blank node (see TODO.md #17).
- `#/…` is a path, `#name` or `name` is an id. JSON Schema's `$ref` uses the
  same convention. This requires ids to never start with `/`.

### Parsing

A path link only ever points backward, so the parser can resolve it as soon as
it reads it. `PathParser` keeps a stack of open containers, each with the key
or index it is currently parsing. A pointer is resolved from the root:

- While the pointer follows the stack, it points into containers that are still
  open. A link to such a container is a cycle, and the stack gives the
  container directly, even though it is not yet assigned to its parent.
- Once the pointer leaves the stack, it points into a completed value, and is
  followed through the normal properties. This also works for subtrees that
  were parsed by the `JSON.parse` fast path.
- A pointer that cannot be resolved this way is a forward reference, and is a
  syntax error.

Path links never enter `meta.unresolved`. They are local to the document, which
matters because a single `Parser` instance keeps its id index and unresolved
links across `parse()` calls.

## Results

`node prototypes/path-links/bench.mjs`, Node v24.7.0, 50,000 records per
dataset. Timings vary by a few percent between runs.

### 1. Plain tree, no repeated references

Output is byte-identical.

| | current (id links) | path links | `JSON.stringify` |
|---|---|---|---|
| stringify | 245 ms | 223 ms | 19 ms |

Removing the pre-walk gives roughly 5–10%. Most of the time goes to per-value
work, which has nothing to do with links (see [Other findings](#other-findings)).

### 2. Shared addresses: 1,000 shared objects, 50,000 references

| | current (id links) | path links |
|---|---|---|
| stringify | 127 ms | 119 ms |
| parse | 486 ms | 182 ms |
| size | 4.5 MB | 3.4 MB |
| average link | 44 bytes | 23 bytes |

Most of the parse difference comes from the current parser, not from path
links themselves: `checkUnresolved` (`src/lib/Parser.mjs`) filters the whole
list of links to an id every time it adds one, which is O(k²) per id. With that
filter removed, the current parser takes about 205 ms on the same input. The
real gain from path links is that they resolve in a single pass, with no
unresolved list, no `WeakRef` index and no `resolveLinks()` pass afterwards.

### 3. Friend graph: every record links to another record

| | current (id links) | path links |
|---|---|---|
| stringify | 323 ms | 3,858 ms |
| parse | 318 ms | 11,051 ms |
| size | 6.4 MB | 184.8 MB |
| average link | 44 bytes | 3,661 bytes |
| max nesting | 1,252 | 1,252 |

Here path links break down. Writing a graph depth first nests each record
inside the first record that refers to it, and so on. Both implementations
produce the same 1,252 levels of nesting. An id link has a fixed length, but a
path link grows with the depth of its target, so both the size and the time to
build and resolve links grow with depth.

## Trade-offs and open questions

- **Graph-shaped data.** The single-pass writer cannot know that an object will
  be referenced again, so it cannot give it a short name in advance. Relative
  pointers (`"3/friend"`, as in the Relative JSON Pointer draft) help for cycles
  to nearby ancestors, but not for long chains. A likely answer is an option
  such as `{ references: 'id' }` that keeps the pre-walk for graph-heavy data.
- **Paths depend on position.** Inserting an array item or renaming a key in a
  document silently changes what a path link points to. Ids survive such
  edits. Path links suit machine-generated round trips. Hand-edited documents
  should keep using ids.
- **Replacers.** Paths must use the keys as written, after the replacer has run.
  The prototype does this, because it records paths while writing.
- **Reviver.** `PathParser` resolves path links before the reviver runs, so the
  reviver sees the linked object, not a `<link>` value. The current parser
  resolves links after the reviver, and the reviver can rewrite links (see the
  `ReviverLink` test). Either resolve path links after the reviver walk when not
  streaming, or document the difference.
- **Memory when streaming.** Any earlier object may be referenced later, so a
  streaming parser has to keep the whole tree. With id links it only needs to
  keep the objects that have an `id`. This follows from writing in a single
  pass and cannot be avoided.
- **Reserved ids.** Ids starting with `/` must be forbidden, or `#/…` must be
  reserved for paths in some other way.

## What real streaming still needs

Path links remove the reason why JSONTag could not be streamed. The code itself
still needs work:

- `stringify` builds the output with `map().join()`. Streaming needs a
  generator or a `write(chunk)` callback.
- `Parser` works on one complete input string. Streaming needs a tokenizer that
  can pause at the end of a chunk and resume with the next one.
- The `JSON.parse` fast paths need a whole container in memory. In a streaming
  parser they can only be used for containers that fit in the current buffer.

## Other findings

These are independent of the link format:

- `stringify` is about 10× slower than `JSON.stringify`. A CPU profile shows
  the time is spent in `str` itself, in a native `JSON.stringify` call for every
  key and every leaf value, and in the `map/filter/join` arrays per container.
- `checkUnresolved` is O(k²) for k links to the same id, as described above.
- When a replacer function returns `undefined` for a property, `stringify`
  writes `"key":null` instead of leaving the property out, as `JSON.stringify`
  does. `encodeProperties` checks the original value instead of the replaced
  one. The prototype keeps this behaviour so its output can be compared with
  the current implementation.
- The tagged array branch in `str` closes with `}` instead of `]`. It is
  unreachable in practice, because `Array.isArray` is checked first.

## Files

| File | Contents |
|---|---|
| `stringify-path.mjs` | `stringify` with path links. Apart from reference handling, identical to the current one. |
| `PathParser.mjs` | `Parser` subclass that resolves path links while parsing. |
| `test.mjs` | Round-trip tests: `npx tap prototypes/path-links/test.mjs` |
| `probe-current.mjs` | Shows the problems in the current `stringify`: `node prototypes/path-links/probe-current.mjs` |
| `bench.mjs` | The benchmarks above: `node prototypes/path-links/bench.mjs` |

## Recommendation

- Use path links by default for objects and arrays without an `id`.
- Keep using id links when an object has an `id`.
- Add a `{ references: 'id' }` option that keeps the pre-walk, for graph-heavy
  data or when links must survive editing.
- In the specification: path links must point backward, and they resolve within
  a single document.
- Fix the O(k²) `checkUnresolved` whatever is decided about path links.
