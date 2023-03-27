import { getTypeString } from "./functions.mjs"

class ExtendableProxy {
	constructor()
	{
		return new Proxy(this,{
			get: (target,name) => {
				if (typeof target[name] !== 'undefined') {
					return target[name]
				}
				if (name == 'then') {
					return undefined
				}
				console.error('Attempting to get from Null', name, typeof name, JSON.stringify(name))
				throw new Error('Attempting to get '+name+' from Null')
			},
			set: (target,name,newValue) => {
				console.error('Attempting to set '+name+' in Null to',newValue)
				throw new Error('Attempting to set '+name+' in Null')	
			}
		})
	}

}

export default class Null extends ExtendableProxy {

	isNull = true;

	toString()
	{
		return ''
	}

	toJSON()
	{
		return 'null'
	}

	toJSONTag()
	{
		let type = getTypeString(this)
		return type+this.toJSON()
	}

}