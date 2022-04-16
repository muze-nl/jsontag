export default class UUID {
	#value;

	constructor(uuid)
	{
		let re=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i
		if (!re.exec(uuid)) {
			throw new TypeError(uuid+' is not a valid UUID')
		}
		this.#value = uuid
	}

	toString()
	{
		return this.#value
	}

	toJSON()
	{
		return '"'+this.#value+'"'
	}

	toTSON()
	{
		return '<uuid>'+this.toJSON()
	}
}