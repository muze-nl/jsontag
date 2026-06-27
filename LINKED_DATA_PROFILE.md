# JSONTag Linked Data Profile

This document describes a possible future direction for JSONTag as an on-ramp
to linked data.

The goal is not to turn JSONTag into a full linked data format. JSONTag should
remain simple to read, write, parse, and debug. The linked data profile should
make it possible to convert a JSONTag document to and from graph-oriented
formats when a `baseURL` is known, without requiring authors to understand RDF
triples or fetch, parse, and apply separate context files.

The profile separates object identity from ontology terms:

- `baseURL` identifies objects in the current document.
- A JSONTag `ontologyURL` attribute selects the ad hoc ontology used by the
  document.

## Goals

- Keep ordinary JSONTag documents easy to write.
- Keep all type and identity information visible in the document.
- Use `baseURL` to assign identities to objects.
- Use a visible `ontologyURL` attribute to select an ad hoc ontology.
- Allow several JSONTag documents to use the same ad hoc ontology.
- Allow conversion scripts to map the ad hoc ontology to established ontologies.
- Avoid accidental semantic merges between properties with the same name on
  different classes.

## Core Idea

JSONTag already allows values to carry a type and attributes:

```js
<object ontologyURL="https://example.org/ontology/people" id="john" class="Person">{
    "name": "John",
    "dob": <date>"1972-09-20"
}
```

With a `baseURL`, this can be interpreted as a document that uses a small ad hoc
ontology:

- `Person` is a class.
- `john` is an object identifier.
- `https://example.org/ontology/people` is the ontology URL.
- `name` is not a global property.
- `name` is a property of `Person`.
- `dob` is also a property of `Person`, with a known JSONTag value type.

This means a JSONTag document can be converted without needing a separate
context file:

```text
Person      -> ontologyURL#class/Person
john        -> baseURL#john
Person.name -> ontologyURL#class/Person/property/name
Person.dob  -> ontologyURL#class/Person/property/dob
```

## Expansion Rules

These are proposed deterministic rules for a linked data profile.

### Base URL

The `baseURL` identifies the document identity root. Object `id` attributes and
local `<link>` values resolve against `baseURL`.

For expansion, any fragment part of `baseURL` should be removed before appending
identity fragments.

```text
https://example.org/people.json#section -> https://example.org/people.json
```

### Ontology URL

The `ontologyURL` attribute selects the ontology used by an object and, by
default, its descendants.

```js
<object ontologyURL="https://example.org/ontology/people" class="Person">{
    "name": "John"
}
```

The `ontologyURL` value must be a full absolute URL. It is not resolved against
`baseURL`. This keeps object identity and ontology identity separate, and allows
several JSONTag documents to share the same ad hoc ontology.

The selected ontology URL is used for classes and properties:

```text
Person      -> https://example.org/ontology/people#class/Person
Person.name -> https://example.org/ontology/people#class/Person/property/name
```

If no `ontologyURL` attribute is present, a converter may use `baseURL` as the
ontology URL. This keeps plain JSONTag documents convertible, while explicit
`ontologyURL` attributes allow several documents to share one ad hoc ontology.

### Object Ids

An object `id` expands to a document-local identifier.

```text
<object id="john">
-> baseURL#john
```

If the id is already a URI reference, it is resolved against `baseURL`.

```text
id="john"                 -> baseURL#john
id="#john"                -> baseURL#john
id="/people/john"         -> https://example.org/people/john
id="https://example.net/" -> https://example.net/
```

For linked data conversion, `id` should only be allowed on objects. This avoids
ambiguous subjects for arrays, scalar values, and typed null values.

### Classes

The whitespace-separated `class` attribute defines local classes.

```text
class="Person"
-> ontologyURL#class/Person

class="Person Employee"
-> ontologyURL#class/Person
-> ontologyURL#class/Employee
```

Class names are local ontology terms. Conversion scripts can later map them to
external ontology classes.

```text
ontologyURL#class/Person -> https://schema.org/Person
```

### Primary Class

When an object has multiple classes, the first class is the primary class.

```js
<object class="Person Employee">{
    "name": "John"
}
```

The object has both classes, but property names are expanded against the primary
class:

```text
Person.name -> ontologyURL#class/Person/property/name
```

This keeps the rule simple and avoids generating multiple predicates for a
single property.

### Properties On Typed Objects

For an object with a primary class, each object key expands as a property of
that class.

```js
<object class="Person">{
    "name": "John"
}
```

```text
"name" -> ontologyURL#class/Person/property/name
```

This avoids accidental semantic merges:

```js
[
    <object class="Person">{
        "name": "John"
    },
    <object class="Product">{
        "name": "Laptop"
    }
]
```

```text
Person.name  -> ontologyURL#class/Person/property/name
Product.name -> ontologyURL#class/Product/property/name
```

The two `name` properties are distinct unless a conversion rule explicitly maps
them to the same external predicate.

### Properties On Untyped Objects

If an object has no class, property names use a generic document-local property
namespace.

```js
{
    "name": "John"
}
```

```text
"name" -> ontologyURL#property/name
```

This preserves deterministic conversion for plain JSON and untyped JSONTag,
while giving better semantics when classes are present.

### Links

`<link>` values are identifiers, not fetch instructions.

```text
<link>"john"                 -> baseURL#john
<link>"#john"                -> baseURL#john
<link>"/people/john"         -> https://example.org/people/john
<link>"https://example.net/" -> https://example.net/
```

A parser may resolve local links to object references for convenience, but a
linked data converter should preserve the expanded identifier.

### JSONTag Value Types

JSONTag value types can be mapped to datatype IRIs by the conversion profile.
The exact target datatype vocabulary can be decided later, but the mapping
should be deterministic.

Examples:

```text
<date>"1972-09-20"       -> date literal
<datetime>"1972-09-20Z"  -> datetime literal
<decimal>"12.50"         -> decimal literal
<url>"https://muze.nl/"  -> IRI-like literal or resource value
```

The important property is that the JSONTag type is inline and local. A converter
does not need a context file to know that a value is a date, decimal, duration,
or link.

### Proposed Type Conversion Table

The linked data profile should prefer existing RDF-compatible XSD datatypes
when there is a clean match. If no clean standard datatype exists, the profile
should either use a graph/resource representation or mint a JSONTag datatype
inside the selected `ontologyURL`.

Prefixes used in this table:

```text
rdf:  http://www.w3.org/1999/02/22-rdf-syntax-ns#
xsd:  http://www.w3.org/2001/XMLSchema#
```

| JSONTag type | Proposed linked data conversion | Match | Notes |
| --- | --- | --- | --- |
| `object` | RDF resource identified by expanded `id`, or a blank node if no `id` exists | Clean graph mapping | Object properties become predicates. Classes become `rdf:type` values. No literal datatype is involved. |
| `array` | Repeated property values by default; `rdf:List`, `rdf:Seq`, or `rdf:Bag` only when list identity/order must be preserved | Profile choice | RDF has list/container vocabularies, but JSON arrays can mean several things. The profile should define one default and allow explicit alternatives later. |
| `string` | `xsd:string` | Clean | Plain JSON strings and `<string>` values. |
| `number` | `xsd:double` | Clean enough | This matches JavaScript number semantics. Exact numeric values should use `decimal` or an integer type. |
| `boolean` | `xsd:boolean` | Clean | Boolean is a JSON value type but is not taggable in JSONTag. |
| `decimal` | `xsd:decimal` | Clean | This is the preferred exact decimal mapping. |
| `money` | Structured value, or `ontologyURL#datatype/money` | No clean scalar | A money value usually needs amount and currency. A single string such as `EUR$123.99` should not be treated as a standard RDF datatype without a JSONTag-specific definition. |
| `uuid` | `xsd:string`, or IRI `urn:uuid:<uuid>` when used as an identifier | Conventional | XSD has no UUID datatype. Use a resource IRI when the UUID identifies something; otherwise use a literal or custom datatype. |
| `url` | RDF IRI resource when used as a link target; otherwise `xsd:anyURI` literal | Clean with intent | Linked data generally wants IRIs as resources, not URL strings. Literal URL values can still use `xsd:anyURI`. |
| `link` | RDF IRI resource resolved against `baseURL` | Clean | This should normally produce an object IRI, not a literal. |
| `date` | `xsd:date` | Clean | Lexical form should be normalized to XSD date form. |
| `time` | `xsd:time` | Clean | Lexical form should be normalized to XSD time form. |
| `datetime` | `xsd:dateTime`; `xsd:dateTimeStamp` when a timezone is required | Clean after normalization | JSONTag currently allows a friendly datetime form. Conversion should emit valid XSD lexical form. |
| `duration` | `xsd:duration` | Clean | More specific mappings to `xsd:yearMonthDuration` or `xsd:dayTimeDuration` are possible when the value fits. |
| `timestamp` | Convert to `xsd:dateTime`, or use `xsd:long` with a documented epoch/unit convention | Needs convention | A numeric timestamp is not self-describing in RDF. Prefer conversion to a datetime literal if the unit is known. |
| `text` | `xsd:string`; later `rdf:langString` if language support is added | Clean | Without a language attribute, this is just a string literal. |
| `blob` | `xsd:base64Binary` if JSONTag requires base64 encoding | Needs stricter JSONTag validation | RDF-compatible XSD includes binary datatypes, but JSONTag must define and validate the encoding first. |
| `color` | `ontologyURL#datatype/color`, fallback `xsd:string` | No clean standard | CSS color syntax is useful, but not an RDF/XSD built-in datatype. |
| `email` | `mailto:` IRI when used as an identifier/contact target; otherwise `xsd:string` or custom datatype | Conventional | There is no XSD email datatype. |
| `hash` | `xsd:hexBinary` only for raw hex; otherwise `ontologyURL#datatype/hash` or `xsd:string` | Needs convention | Hash formats differ: hex, base64, multihash, IPFS CIDs, and named algorithms are not equivalent. |
| `phone` | `tel:` IRI when normalized; otherwise `xsd:string` or custom datatype | Conventional | There is no XSD phone datatype. |
| `range` | Structured value with start/end literals, or `ontologyURL#datatype/range` | No clean scalar | The current string form carries two values. A graph representation is clearer than a single opaque literal. |
| `int` | `xsd:integer` | Clean | Arbitrary-size signed integer. |
| `int8` | `xsd:byte` | Clean | Same value range. |
| `int16` | `xsd:short` | Clean | Same value range. |
| `int32` | `xsd:int` | Clean | Same value range. |
| `int64` | `xsd:long` | Clean | Same value range. |
| `uint` | `xsd:nonNegativeInteger` | Clean | Arbitrary-size unsigned integer. |
| `uint8` | `xsd:unsignedByte` | Clean | Same value range. |
| `uint16` | `xsd:unsignedShort` | Clean | Same value range. |
| `uint32` | `xsd:unsignedInt` | Clean | Same value range. |
| `uint64` | `xsd:unsignedLong` | Clean | Same value range. |
| `float` | `xsd:double` | Clean enough | JSONTag `float` is not precision-specific; `xsd:double` is the safer default. |
| `float32` | `xsd:float` | Clean | Same broad 32-bit floating-point intent. |
| `float64` | `xsd:double` | Clean | Same broad 64-bit floating-point intent. |

The profile should avoid forcing weak mappings into standard datatypes. When a
type has no clean RDF/XSD equivalent, a JSONTag-specific datatype under
`ontologyURL` is more explicit than pretending the value is just a generic
string.

## Conversion Rules

The profile creates stable local terms. Separate conversion rules can map those
terms to other ontologies.

For example, a JSONTag document might define:

```text
ontologyURL#class/Person
ontologyURL#class/Person/property/name
ontologyURL#class/Person/property/dob
```

A conversion script can map those to:

```text
ontologyURL#class/Person/property/name -> https://schema.org/name
ontologyURL#class/Person/property/dob  -> https://schema.org/birthDate
ontologyURL#class/Person               -> https://schema.org/Person
```

This keeps JSONTag usable without requiring authors to know `schema.org`, RDF,
JSON-LD contexts, or triples up front.

## Why Not Global Properties By Default?

A simpler rule would be:

```text
"name" -> ontologyURL#property/name
```

That is easy, but it treats all `name` properties as the same predicate. In ad
hoc JSON documents, the same property name often means different things in
different object types.

Class-scoped properties avoid this accidental merge:

```text
Person.name  != Product.name
```

The tradeoff is that class order matters when multiple classes are present. The
profile resolves that by making the first class the primary class.

## Open Questions

- Should `class` values allow full URI references as well as local tokens?
- Should property names that are full URI references bypass class scoping?
- Should nested untyped objects inherit the nearest parent class, or remain
  generic untyped objects?
- Should nested objects inherit the nearest `ontologyURL` attribute, or should
  only the root object select the ontology?
- Should arrays convert as ordered lists, repeated property values, or both
  depending on position?
- Should `id` be rejected on all non-object values by the parser, or only by
  linked data conversion tools?
- Should the profile reserve optional attributes such as `lang` or `datatype`,
  or avoid them until a concrete need appears?
- Should JSONTag define stricter lexical validation for `blob`, `hash`,
  `timestamp`, and `money` so they can map more cleanly?

## Implementation Sketch

The parser does not need to understand graph semantics. It only needs to expose
the parsed JSONTag values, their types, their attributes, and the parser
`baseURL`.

A future module could implement the profile:

```js
JSONTag.toLinkedData(value, { baseURL })
JSONTag.fromLinkedData(graph, { baseURL, mappings })
```

The first step can be a small helper module that expands local terms:

```js
expandId(id, baseURL)
validateOntologyURL(ontologyURL)
expandClass(className, ontologyURL)
expandProperty(propertyName, primaryClass, ontologyURL)
expandLink(linkValue, baseURL)
```

This keeps JSONTag simple while making the linked data path explicit,
deterministic, and testable.

## References

- [RDF 1.1 Concepts and Abstract Syntax](https://www.w3.org/TR/rdf11-concepts/)
- [RDF Schema 1.1](https://www.w3.org/TR/rdf-schema/)
- [XML Schema Definition Language 1.1 Part 2: Datatypes](https://www.w3.org/TR/xmlschema11-2/)
