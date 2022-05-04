import { getAttributesString } from "./functions.mjs"

export default class UUID {
	#value;

	constructor(uuid)
	{
		let re = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-8][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i
		if (!re.test(uuid)) {
			throw new TypeError(uuid+' is not a valid UUID')
		}
		this.#value = ''+uuid
	}

	static from(uuid)
	{
		if (uuid instanceof UUID) {
			return uuid
		}
		return new UUID(uuid)
	}
	
	get value()
	{
		return this.#value
	}

	toString()
	{
		return this.#value
	}

	toJSON()
	{
		return '"'+this.#value+'"'
	}

	toJSONTag()
	{
		let attributes = getAttributesString(this)
		return '<uuid'+(attributes ? ' ' + attributes : '')+'>'+this.toJSON()
	}

}