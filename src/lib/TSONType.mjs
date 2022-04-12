export default class TSONType {
	#attributes={};

	setAttribute(attr, value)
	{
		if (typeof value !== 'string') {
			throw new TypeError('attribute values must be a string')
		}
		if (value.indexOf('"')!==-1) {
			throw new TypeError('attribute values must not contain " character')
		}
		if (value.indexOf(' ')!==-1) {
			value = value.split(" ")
		}
		this.#attributes[attr] = value
	}

	getAttribute(attr)
	{
		return this.#attributes[attr]
	}

	addAttribute(attr, value)
	{
		if (typeof value !== 'string') {
			throw new TypeError('attribute values must be a string')
		}
		if (value.indexOf('"')!==-1) {
			throw new TypeError('attribute values must not contain " characters')
		}	
		if (typeof this.#attributes[attr] === 'undefined') {
			this.setAttribute(attr, value)
		} else {
			if (!Array.isArray(this.#attributes[attr])) {
				this.#attributes[attr] = [ this.#attributes[attr] ]
			}
			if (value.indexOf(' ')!==-1) {
				value = value.split(" ")
			} else {
				value = [ value ]
			}
			this.#attributes[attr] = this.#attributes.concat(value)
		}
	}

	removeAttribute(attr)
	{
		if ( typeof this.#attributes[attr] !== 'undefined') {
			delete this.#attributes[attr]
		}
	}

	getAttributesString()
	{
		return Object.keys(this.#attributes).map(attr => {
			let attrValue = this.#attributes[attr]
			if (Array.isArray(attrValue)) {
				attrValue = attrValue.join(' ')
			}	
			return attr+'="'+attrValue+'"'
		}).join(' ')
	}
}