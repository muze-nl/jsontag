# JSONTag: Tagged JSON

JSON has won the battle for universal data interchange format. There are still some holdouts using XML or SOAP, but if you start a new online API today, the default is JSON. Even the linked data proponents have made a JSON version, called JSON-LD.

However, JSON has a problem. It is too restricted. There are too few basic data types. This means that if you do need to specify a specific data type, like `Date`, you must go out of your way to either define a JSON Schema, or, another external definition, like JSON-LD does. This leads to unnecessary complexity.

Instead of creating another Something-in-JSON format, JSONTag enhances the JSON format with additional type information inline. Every JSON file is valid JSONTag. Every JSONTag file can be easily stripped of type information to get valid JSON.

JSONTag looks like this:
```
<object class="Person">{
	"name": "John",
	"dob": <date>"1972-09-20"
}
```

Type information is inserted immediately in front of a value, enclosed in `<` and `>` characters. There is a restricted list of types. But you can add extra attributes to the types for more information.

For example, though there is only one type `object`, just like in JSON, you can enhance it with attributes. Here we've added the `class` attribute. The type syntax is based heavily on the HTML tag syntax. There is one difference, attribute names are more restricted. You aren't allowed to use the `-` character in an attribute name. This is because it leads to less readable code in most programming languages.

## Install / Usage

```shell
npm install @muze-nl/JSONTag
```

In the browser:

```javascript
<script src="node_modules/JSONT/dist/browser.js"></script>
<script>
    let p = JSONTag.parse('<object class="Person">{"name":"John"}')
    let s = JSONTag.stringify(p)
</script>
```

In node:
```javascript
import JSONTag from 'JSONTag'

let p = JSONTag.parse('<object class="Person">{"name":"John"}')
let s = JSONTag.stringify(p)
```

## JSONTag Types

The list below is preliminary. The aim is to have a good coverage of most used or useful types, without creating an unwieldy specification. It should be only slightly harder to implement JSONTag support compared to JSON support. Some inspiration was taken from HTML, PostgreSQL and [RED](https://red-lang.org)

### JSON derived

- boolean
- number
- string
- object
- array

### Lowlevel scalars

- text
- blob
- int (unit, int8, uint8, int16, uint16, int32, uint32, int64, uint64)
- float (float32, float64)

### Semantic types

- color
- date
- decimal
- email
- hash
- interval
- link
- money
- phone
- range
- time
- timestamp
- url
- uuid

## Circular data, or references

One shortcoming of JSON is that it cannot represent data with internal references. JSONTag solves this by introducing the `<link>` type. Here's an example:

```
<object id="source">{
	"foo":{
		"bar":"Baz"
	},
	"bar":<link>"#source"
}
```	

When parsed the property `bar` is a reference to the parent object of that property. The current stringify implementation (javascript) automatically add `id` attributes and `link` values when a reference to a previous value is found.

This allows for complex graphs to be serialized to JSONTag and revived correctly. The `<link>` type does not specify a specific format, other that a string. It is implied that the URL format is explicitly supported as the default.

## Typed Null values

JSON only supports a single `null` value. Each null is identical to each other null. This makes it impossible to add type and attribute information to it. So JSONTag uses a Null class. Each instance of the Null class is unique. The Null class has no properties or methods, except for:
- isNull: property, always true
- toString: returns ''
- toJSON: returns 'null'
- toJSONTag: return typeInfo + 'null'

Any access to other properties or methods results in an exception

Because JSONTag now can keep type and attribute information, you could create your own typed Null object when reviving JSONTag data.

## Monkeypatching

Upgrade a program to use JSONTag by:

```javascript
JSON.parse = JSONTag.parse
JSON.stringify = JSONTag.stringify
```

Since the API is identical this just works. Use at your own risk however...

FIXME: JSONTag user JSON.stringify internally. So make a referfence to the original stringify function on load. 

## Reviver extension

JSON.Parse has a `reviver` parameter, and JSONTag.parse has it too. It is fully backwards compatible, but it adds an extra parameter:

```javascript
let result = JSONTag.parse(JSONTag, function(key, value, meta) {

})
```

The extra meta parameter is an object with an `ids` property, which is an object with all `id` attribute values found in the JSONTag text. As well as a `unresolved` property, which is an array with all `<link>` values, which haven't yet been resolved.

## TODO

- add Date format to parser, so only ISO-8601 formatted dates pass

- figure out if the URL parser must become strict, to avoid server-side request forgery using differences in the parsing of invalid URLs

- tie down decimal format, money format, allow "," in money format, only every 3 digits

- add stub type class for most JSONTag types, make it optional to instantiate these instead of base json types

- write more tests


## Motivation

You might be wondering why someone would create yet another data interchange format. What is wrong with all the stuff that already exists?

For that, I need some background. I've long wondered how and why the Web has gotten so big and universal, in such a short time. And why it has staying power. Lots of smart people have criticized certain design principles of the web. Specifically the limitations in HTML, how it for a long time didn't allow extensions. There was no concept of abstractions building on top of eachother, like we're used to in programming language. So later on we got XML (and XHTML), trying to fix (among other things) that lack of abstraction.

And yet, XML has lost to JSON, which again has no concept of adding new abstractions. 

With the semantic web and Linked Data, people all over the world are trying to build a new data-centric (or knowledge-centric) web. One of the attempts to make this more popular is to embrace JSON (with JSON-LD) and extend it to support meta information, or specifically meaning, semantics. However, this hasn't really worked yet. 

Given a list of things that have worked, read: become popular or even universal, versus the list of things that have not become popular, I found one common thing:

All popular formats are fundamentally limited. You cannot extend the format itself.

The hypothesis, which JSONTag is trying to prove, is that by fixing the format, every implementation is also fixed, so there are no dialects. Everyone is talking the same language. Therefor, it becomes trivial to support it everywhere.

Whereas more powerfull formats, which do allows for extension, e.g. XML, become fragmented.

I believe that the Linked Data world is such a fragmented world. There are islands of interoperability, where organizations have agreed to a set of common ontologies. But if you step outside those islands, there is no common base. Attempts like dublin core and skos, fail because they are so broad that you can't use it without an academic level comprehension of linked data and knowledge bases.

With JSONTag I'm attempting to create such a base. The idea is that by broadening JSON, and keeping it backwards compatible, it will be easy for programmers to incorporate. The next step is to create a universal JSONTag client, just like the browser is a universal HTML client. This universal JSONTag client should be able to render any JSONTag in human readable format. You should be able to query it and edit it. And you should be able to add scripts. This client will most probably be an extension on the normal web browser, hopefully just by adding some javascript.

Once this universal client exists, I'm hoping that Linked Data will be a normal and sensible progression from that base. For that reason I'm also creating a JSONTag ontology. This ontology differs from the usual Linked Data ontologies, in that it only specifies the format of its Subjects, not the meaning. So there will be no 'startDate' or 'endDate', just 'date'. But hopefully because of that, it may become a kind of low level glue that connects different ontologies.

Because I would like Linked Data to be a natural fit for JSONTag, I haven't (yet) limited what kind of attributes you can add. JSONTag itself defines just two:
- id
- class
