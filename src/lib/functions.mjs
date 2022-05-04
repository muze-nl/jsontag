import * as uuid from 'uuid'

// keep reference to original JSON.stringify, in case someone monkeypatches it
const jsonStringify = JSON.stringify

export const stringify = (value, replacer=null, space="") => {

	let references = new WeakMap()

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
			return '"'+prop+'":'+str(prop, obj)
		}).join(","+gapstart)+gapend
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
		if (typeof value === 'object' && references.has(value)) {
			let id = getAttribute(value, 'id')
			if (!id) {
				id = createId(value)
			}
			return '<link>"#'+id+'"'
		}
		if (typeof value === 'undefined' || value === null) {
			return 'null'
		}
		if (typeof value.toJSONTag == 'function') {
			return value.toJSONTag(references, replacer, space)
		} else if (Array.isArray(value)) {
			return getTypeString(value) + "["+encodeEntries(value)+"]"
		} else if (value instanceof Object) {
			switch (getType(value)) {
				case 'string':
				case 'decimal':
				case 'money':
				case 'link':
				case 'url':
				case 'uuid':
					return getTypeString(value) + jsonStringify(''+value, replacer, space)
				break
				case 'number':
				case 'boolean':
					return getTypeString(value) + jsonStringify(value, replacer, space)
				break
				case 'array': 
					return getTypeString(value) + '[' + encodeEntries(value) + '}'
				break
				case 'object': 
					if (typeof replacer === 'function') {
						value = replacer.call(holder, key, value)
					}
					if (value === null) {
						return "null"
					}
					return getTypeString(value) + '{' + encodeProperties(value) + '}'
				break
				default:
					throw new Error(getType(value)+' type not yet implemented')
				break
			}
		} else {
			return jsonStringify(value, replacer, space)
		}
	}

	return str("", {"": value})
}

function createId(value) {
	let id = uuid.v4()
	setAttribute(value, 'id', id)
	return id
}

export const isNull = (v) => {
	let result = (v === null) || (typeof v.isNull !== 'undefined' && v.isNull)
	return result
}

const typeInfo = new WeakMap()

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
	return typeof obj
}

export const types = [
	'object','array','string','number','boolean',				// JSON
	'decimal','money','uuid','link','date','time','datetime'
]

export const setType = (obj, type) => {
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

