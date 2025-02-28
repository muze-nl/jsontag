
// keep reference to original JSON.stringify, in case someone monkeypatches it
const jsonStringify = JSON.stringify

export const stringify = (value, replacer=null, space="") => {

	const objectReferences = new WeakMap()

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

	/**
	 * Walks over all objects in value to set ids if needed
	 */
	const checkCircular = new WeakMap()
	function createIds(value) {
		if (Array.isArray(value)) {
			for (let v of value) {
				createIds(v)
			}
		} else if (value && getType(value)=='object') {
			if (checkCircular.has(value)) {
				let id = getAttribute(value, 'id')
				if (!id) {
					createId(value)
				}
			} else {
				checkCircular.set(value, true)
				for (let v of Object.values(value)) {
					createIds(v)
				}
			}
		}
	}

	const str = (key, holder) => {
		let value = holder[key]
		if (typeof replacer === 'function' && key!=='') {
			value = replacer.call(holder, key, value)
		}
		if (getType(value) === 'object' && objectReferences.has(value)) {
			let id = getAttribute(value, 'id')
			if (!id) {
				// FIXME: this is too late, value may already have been stringified, without id earlier
				id = createId(value)
			}
			return '<link>"'+id+'"'
		}
		if (typeof value === 'undefined' || value === null) {
			return 'null'
		}
		if (getType(value) === 'object') {
			objectReferences.set(value, true)
		}
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
			switch (getType(value)) {
				case 'string':
				case 'decimal':
				case 'money':
				case 'link':
				case 'text':
				case 'blob':
				case 'color':
				case 'email':
				case 'hash':
				case 'duration':
				case 'phone':
				case 'url':
				case 'uuid':
				case 'date':
				case 'time':
				case 'datetime':
					return getTypeString(value) + jsonStringify(''+value, replacer, space)
				break
				case 'int':
				case 'uint':
				case 'int8':
				case 'uint8':
				case 'int16':
				case 'uint16':
				case 'int32':
				case 'uint32':
				case 'int64':
				case 'uint64':
				case 'float':
				case 'float32':
				case 'float64':
				case 'timestamp':
				case 'number':
				case 'boolean':
					return getTypeString(value) + jsonStringify(value, replacer, space)
				break
				case 'array': 
					let entries = encodeEntries(value) // calculate children first so parent references can add id attribute
					return getTypeString(value) + '[' + entries + '}'
				break
				case 'object': 
					if (value === null) {
						return "null"
					}
					let props = encodeProperties(value); // calculate children first so parent references can add id attribute
					return getTypeString(value) + '{' + props + '}'
				break
				default:
					throw new Error(getType(value)+' type not yet implemented')
				break
			}
		} else {
			return jsonStringify(value, replacer, space)
		}
	}

	// first check if there are circular references
	// if so, make sure that the referenced objects have an id attribute
	createIds(value)
	const result = str("", {"": value})
	return result
}

function createId(value) {
	if (typeof crypto.randomUUID === 'function') {
		var id = crypto.randomUUID()
	} else {
		// Fallback for when crypto.randomUUID is not available
		let replacer = c => (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4)

		if (typeof crypto === 'undefined') {
			// Fallback even further for when crypto API is not available
			replacer = c => (c ^ Math.random() * 256 & 15 >> c / 4)
		}

		var id = ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c => replacer(c).toString(16));
	}
	setAttribute(value, 'id', id)
	return id
}


export const isNull = (v) => {
	let result = (v === null) || (typeof v.isNull !== 'undefined' && v.isNull)
	return result
}

if (!globalThis.JSONTagTypeInfo) {
	globalThis.JSONTagTypeInfo = new WeakMap()
}
const typeInfo = globalThis.JSONTagTypeInfo

export const getType = (obj) => {
	if (typeInfo.has(obj)) {
		let info = typeInfo.get(obj)
		if (info.type) {
			return info.type
		}
	}
	if (Array.isArray(obj)) {
		return 'array'
	}
	if (obj instanceof Number) {
		return 'number'
	}
	if (obj instanceof Boolean) {
		return 'boolean'
	}
	return typeof obj
}

export const types = [
	'object','array','string','number','boolean',				// JSON
	'decimal','money','uuid','url','link','date','time','datetime', 'duration', 'timestamp',
	'text', 'blob', 'color', 'email', 'hash', 'phone',
	'int', 'int8', 'int16', 'int32', 'int64',
	'uint', 'uint8', 'uint16', 'uint32', 'uint64',
	'float', 'float32', 'float64'
]

export const setType = (obj, type) => {
	if (typeof obj !== 'object') {
		throw new TypeError('JSONTag can only add attributes to objects, convert literals to objects first')
	}
	let info = {}
	if (typeInfo.has(obj)) {
		info = typeInfo.get(obj)
	}
	if (!types.includes(type)) {
		throw new TypeError('unknown type '+type)
	}
	info.type = type
	if (typeof info.attributes === 'undefined') {
		info.attributes = {}
	}
	typeInfo.set(obj, info)
}

export const setAttribute = (obj, attr, value) => {
	if (typeof obj !== 'object') {
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
	let info = typeInfo.get(obj) || { attributes: {}}
	info.attributes[attr] = value
	typeInfo.set(obj, info)
}

export const setAttributes = (obj, attributes) => {
	if (typeof obj !== 'object') {
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
	let info = typeInfo.get(obj) || { attributes: {}}
	return info.attributes[attr]
}

export const addAttribute = (obj, attr, value) => {
	if (typeof value !== 'string') {
		throw new TypeError('attribute values must be a string')
	}
	if (value.indexOf('"')!==-1) {
		throw new TypeError('attribute values must not contain " characters')
	}	
	let info = typeInfo.get(obj) || { attributes: {}}
	if (typeof info.attributes[attr] === 'undefined') {
		setAttribute(obj, attr, value)
	} else {
		if (!Array.isArray(info.attributes[attr])) {
			info.attributes[attr] = [ info.attributes[attr] ]
		}
		if (value.indexOf(' ')!==-1) {
			value = value.split(" ")
		} else {
			value = [ value ]
		}
		info.attributes[attr] = info.attributes[attr].concat(value)
		typeInfo.set(obj, info)
	}
}

export const removeAttribute = (obj, attr) => {
	let info = typeInfo.get(obj) || { attributes: {}}
	if ( typeof info.attributes[attr] !== 'undefined') {
		delete info.attributes[attr]
		typeInfo.set(obj, info)
	}
}

export const getAttributes = (obj) => {
	let info = typeInfo.get(obj) || { attributes: {}}
	return Object.assign({},info.attributes)
}

export const getAttributesString = (obj) => {
	return Object.entries(getAttributes(obj))
		.map(([attr, attrValue]) => {
			if (Array.isArray(attrValue)) {
				attrValue = attrValue.join(' ')
			}	
			return attr+'="'+attrValue+'"'
		})
		.join(' ')
}

export const getTypeString = (obj) => {
	let type = getType(obj)
	let attributes = getAttributes(obj)
	let attributesString = Object.entries(attributes)
		.map(([attr, attrValue]) => {
			if (Array.isArray(attrValue)) {
				attrValue = attrValue.join(' ')
			}	
			return attr+'="'+attrValue+'"'
		})
		.join(' ')
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
		return new Boolean(o)
	}
	if (o instanceof String) {
		return new String(o)
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