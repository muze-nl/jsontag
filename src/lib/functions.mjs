import TSONType from './TSONType.mjs'

export const stringify = value => {
	if (value instanceof TSONType) {
		return value.toTSON()
	} else if (Array.isArray(value)) {
		return '['+encodeEntries(value)+']'
	} else if (value instanceof Object) {
		if (typeof value.toTSON === 'function') {
			return value.toTSON()
		} else if (typeof value.toJSON === 'function') {
			return value.toJSON()
		} else {
			//@FIXME: avoid circular references
			return '{' + encodeProperties(value) + '}'
		}
	} else {
		return JSON.stringify(value)
	}
}

export const parse = str => {

}

export const encodeProperties = obj => {
	return Object.keys(obj).map(prop => {
		return '"'+prop+'":'+stringify(obj[prop])
	}).join(',')
}

export const encodeEntries = arr => {
	return arr.map(value => {
		return stringify(value)
	}).join(',')
}
