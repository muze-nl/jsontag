import { getAttributes, setAttributes, getType, setType } from "./functions.mjs"

export default class Link {

    constructor(url)
    {
        if (typeof url !== 'string') {
            throw new Error('not a url:',url)
        }
        Object.defineProperty(this, 'url', {
            configurable: false,
            writable: false,
            value: ''+url
        })
        setType(this, 'link')
    }

    static from(url)
    {
        if (url instanceof Link) {
            return url
        }
        if (typeof url !== 'string') {
            throw new Error('not a url:',url)
        }
        return new Link(url)
    }

    toString()
    {
        return this.url
    }

    toJSON()
    {
        return this.url
    }

    toJSONTag()
    {
        let result = new String(this.url)
        let attributes = getAttributes(this)
        if (attributes) {
            setAttributes(result, attributes)
        }
        setType(result, 'link')
        return result
    }

}