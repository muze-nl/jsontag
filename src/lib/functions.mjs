export const stringify = (value, references=null) => {
	if (!references) {
		references = new WeakMap()
	}
	if (typeof value === 'object' && references.has(value)) {
		let id = getId(value)
		if (!id) {
			id = setId(value)
		}
		return '<link>"#'+id+'"'
	}
	if (typeof value === 'undefined') {
		return 'null'
	}
	if (typeof value.toTSON == 'function') {
		return value.toTSON(references)
	} else if (Array.isArray(value)) {
		return getTypeString(value) + '['+encodeEntries(value, references)+']'
	} else if (value instanceof Object) {
		switch (getType(value)) {
			case 'object': 
				// FIXME: handle null?
				return getTypeString(value) + '{' + encodeProperties(value, references) + '}'
			break
			case 'array': 
				return getTypeString(value) + '[' + encodeEntries(value, references) + '}'
			break
			case 'string':
			case 'decimal':
			case 'money':
			case 'link':
			case 'url':
			case 'uuid':
				return getTypeString(value) + JSON.stringify(''+value)
			break
			case 'number':
			case 'boolean':
				return getTypeString(value) + JSON.stringify(value)
			break
			default:
				throw new Error(getType(value)+' type not yet implemented')
			break
		}
	} else {
		return JSON.stringify(value)
	}
}

export const encodeProperties = (obj, references=null) => {
	return Object.keys(obj).map(prop => {
		return '"'+prop+'":'+stringify(obj[prop], references)
	}).join(',')
}

export const encodeEntries = (arr, references=null) => {
	return arr.map(value => {
		return stringify(value, references)
	}).join(',')
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
	'object','array','string','number','boolean',
	'decimal','money','uuid','link'
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
	let classlist = getAttribute(obj, 'class')
	let attributes = getAttributes(obj)
	if (classlist && typeof classlist === 'string') {
		let classname = classlist
		if (classname[0].toUpperCase()===classname[0]) {
			delete attributes.class
			type = classname
		}
	}
	let attributesString = Object.entries(attributes)
		.map(([attr, attrValue]) => {
			if (Array.isArray(attrValue)) {
				attrValue = attrValue.join(' ')
			}	
			return attr+'="'+attrValue+'"'
		})
		.join(' ')
	if (type || attributesString) {
		return '<' + [type, attributesString].filter(Boolean).join(' ') + '>'
	} else {
		return '';
	}
}