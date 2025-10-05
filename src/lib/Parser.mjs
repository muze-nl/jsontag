// non streaming handbuilt jsontag parser
import * as JSONTag from './functions.mjs'
import Null from './Null.mjs'


export default class Parser
{
    at
    ch
    input
    context
    meta

    escapee = {
        '"': '"',
        "\\":"\\",
        '/': '/',
        b: "\b",
        f: "\f",
        n: "\n",
        r: "\r",
        t: "\t"
    }

    regexes = {
        color: /^(rgb|hsl)a?\((\d+%?(deg|rad|grad|turn)?[,\s]+){2,3}[\s\/]*[\d\.]+%?\)$/i,
        email: /^[A-Za-z0-9_!#$%&'*+\/=?`{|}~^.-]+@[A-Za-z0-9.-]+$/,
        uuid:  /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/,
        decimal: /^\d*\.?\d*$/,
        money: /^[A-Z]+\$\d*\.?\d*$/,
        duration: /^(-?)P(?=\d|T\d)(?:(\d+)Y)?(?:(\d+)M)?(?:(\d+)([DW]))?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?)?$/,
        phone: /^[+]?(?:\(\d+(?:\.\d+)?\)|\d+(?:\.\d+)?)(?:[ -]?(?:\(\d+(?:\.\d+)?\)|\d+(?:\.\d+)?))*(?:[ ]?(?:x|ext)\.?[ ]?\d{1,5})?$/,
        time: /^(\d{2}):(\d{2})(?::(\d{2}(?:\.\d+)?))?$/,
        date: /^-?[1-9][0-9]{3,}-([0][1-9]|[1][0-2])-([1-2][0-9]|[0][1-9]|[3][0-1])$/,
        datetime: /^(\d{4,})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}(?:\.\d+)?))?Z?$/,
        range: /^\[-?(\d+\.)?\d+\,-?(\d+\.)?\d+\]$/
    }

    constructor(baseURL = 'http://localhost/')
    {
        this.meta = {
            index: {
                id: new Map()
            },
            unresolved: new Map(),
            baseURL
        }
    }

    error(message)
    {
        throw new SyntaxError(message, this)
    }

    next(c)
    {
        if (c && c!==this.ch) {
            this.error("Expected '"+c+"' instead of '"+this.ch+"'")
        }
        this.ch = this.input.charAt(this.at)
        this.at+=1
        return this.ch
    }
    
    number(tagName)
    {
        let numString = ''
        if (this.ch==='-') {
            numString = '-'
            this.next('-')
        }
        while(this.ch>='0' && this.ch<='9') {
            numString += this.ch
            this.next()
        }
        if (this.ch==='.') {
            numString+='.'
            while(this.next() && this.ch >= '0' && this.ch <= '9') {
                numString += this.ch
            }
        }
        if (this.ch === 'e' || this.ch === 'E') {
            numString += this.ch
            this.next()
            if (this.ch === '-' || this.ch === '+') {
                numString += this.ch
                this.next()
            }
            while (this.ch >= '0' && this.ch <= '9') {
                numString += this.ch
                this.next()
            }
        }
        let result = new Number(numString).valueOf()
        if (tagName) {
            switch(tagName) {
                case "int":
                    this.isInt(numString)
                    break
                case "uint":
                    this.isInt(numString, [0,Infinity])
                    break
                case "int8":
                    this.isInt(numString, [-128,127])
                    break
                case "uint8":
                    this.isInt(numString, [0,255])
                    break
                case "int16":
                    this.isInt(numString, [-32768,32767])
                    break
                case "uint16":
                    this.isInt(numString, [0,65535])
                    break
                case "int32":
                    this.isInt(numString, [-2147483648, 2147483647])
                    break
                case "uint32":
                    this.isInt(numString, [0,4294967295])
                    break
                case "timestamp":
                case "int64":
                    this.isBigInt(numString, [BigInt("-9223372036854775808"),BigInt("9223372036854775807")])
                    break
                case "uint64":
                    this.isBigInt(numString, [0,BigInt("18446744073709551615")])
                    break
                case "float":
                    this.isFloat(numString)
                    break
                case "float32":
                    this.isFloat(numString, [-3.4e+38,3.4e+38])
                    break
                case "float64":
                    this.isFloat(numString, [-1.7e+308,+1.7e+308])
                    break
                case "number":
                    //FIXME: what to check? should already be covered by JSON parsing rules?
                    break
                default:
                    this.typeError(tagName,numString)
                    break
            }
        }
        return result        
    }

    typeError(type, value)
    {
        this.error('Syntax error, expected '+type+', got: '+value)    
    }

    isFloat(float, range)
    {
        let test = new Number(parseFloat(float))
        let str = test.toString()
        if (float!==str) {
            this.error('Syntax Error: expected float value')
        }
        if (range) {
            if (typeof range[0] === 'number') {
                if (test<range[0]) {
                    this.error('Syntax Error: float value out of range')
                }
            }
            if (typeof range[1] === 'number') {
                if (test>range[1]) {
                    this.error('Syntax Error: float value out of range')    
                }
            }
        }
    }

    isBigInt(int, range)
    {
        let test = BigInt(int)
        let str = test.toString()
        if (int!==str) {
            this.error('Syntax Error: expected integer value')
        }
        if (range) {
            if (typeof range[0] === 'number' || typeof range[0] === 'bigint') {
                if (test<range[0]) {
                    this.error('Syntax Error: integer value out of range')
                }
            }
            if (typeof range[1] === 'number' || typeof range[1] === 'bigint') {
                if (test>range[1]) {
                    this.error('Syntax Error: integer value out of range')    
                }
            }
        }
    }

    isInt(int, range)
    {
        let test = new Number(parseInt(int))
        let str = test.toString()
        if (int!==str) {
            this.error('Syntax Error: expected integer value')
        }
        if (range) {
            if (typeof range[0] === 'number') {
                if (test<range[0]) {
                    this.error('Syntax Error: integer value out of range')
                }
            }
            if (typeof range[1] === 'number') {
                if (test>range[1]) {
                    this.error('Syntax Error: integer value out of range')    
                }
            }
        }
    }

    isColor(color)
    {
        let result = false
        if (color.charAt(0) === "#") {
            color = color.substring(1)
            result = ([3, 4, 6, 8].indexOf(color.length) > -1) && !isNaN(parseInt(color, 16))
            if (result.toString(16)!==color) {
                this.typeError('color', color)
            }
        } else {
            result = this.regexes.color.test(color)
        }
        if (!result) {
            this.typeError('color',color)
        }
        return true
    }


    isType(type, value)
    {
        let result = this.regexes[type].test(value)
        if (!result) {
            this.typeError(type, value)
        }
        return true        
    }

    isUrl(url)
    {
        try {
            return Boolean(new URL(url, this.meta.baseURL))
        } catch(e) {
            this.typeError('url',url)
        }
    }

    checkStringType(tagName, value)
    {
        if (!tagName) {
            return
        }
        switch(tagName){
            case "object":
            case "array":
            case "int8":
            case "uint8":
            case "int16":
            case "uint16":
            case "int32":
            case "uint32":
            case "int64":
            case "uint64":
            case "int":
            case "uint":
            case "float32":
            case "float64":
            case "float":
            case "timestamp":
                this.typeError(tagName, value)
                break
            case "uuid":
                return this.isType('uuid',value)
            case "decimal":
                return this.isType('decimal',value)
            case "money":
                return this.isType('money',value)
            case "url":
                return this.isUrl(value)
            case "link":
            case "string":
            case "text":
            case "blob":
            case "hash":
                //anything goes
                return true
            case "color":
                return this.isColor(value)
            case "email":
                return this.isType('email',value)
            case "duration":
                return this.isType('duration',value)
            case "phone":
                return this.isType('phone',value)
            case "range":
                return this.isType('range',value)
            case "time":
                return this.isType('time',value)
            case "date":
                return this.isType('date',value)
            case "datetime":
                return this.isType('datetime',value)
        }
        this.error('Syntax error: unknown tagName '+tagName)
    }

    string(tagName)
    {
        let value = "", hex, i, uffff;
        if (this.ch !== '"') {
            this.error("Syntax Error")
        }
        this.next('"')
        while(this.ch) {
            if (this.ch==='"') {
                this.next()
                this.checkStringType(tagName, value)
                return value
            }
            if (this.ch==='\\') {
                this.next()
                if (this.ch==='u') {
                    uffff=0
                    for (i=0; i<4; i++) {
                        hex = parseInt(this.next(), 16)
                        if (!this.isFinite(hex)) {
                            break
                        }
                        uffff = uffff * 16 + hex
                    }
                    value += String.fromCharCode(uffff)
                    this.next()
                } else if (typeof this.escapee[this.ch] === 'string') {
                    value += this.escapee[this.ch]
                    this.next()
                } else {
                    break
                }
            } else {
                value += this.ch
                this.next()
            }
        }
        this.error("Syntax error: incomplete string")
    }

    tag()
    {
        let key, val, tagOb={
            attributes: {}
        }
        if (this.ch !== '<') {
            this.error("Syntax Error")
        }
        this.next('<')
        key = this.word()
        if (!key) {
            this.error('Syntax Error: expected tag name')
        }
        tagOb.tagName = key
        this.whitespace()
        while(this.ch) {
            if (this.ch==='>') {
                this.next('>')
                return tagOb
            }
            key = this.word()
            if (!key) {
                this.error('Syntax Error: expected attribute name')
            }
            this.whitespace()
            this.next('=')
            this.whitespace()
            val = this.string()
            tagOb.attributes[key] = val
            this.whitespace()
        }
        this.error('Syntax Error: unexpected end of input')
    }

    whitespace()
    {
        while (this.ch) {
            switch(this.ch) {
                case ' ':
                case "\t":
                case "\r":
                case "\n":
                    this.next()
                break
                default:
                    return
                break
            }
        }
    }

    word()
    {
        //[a-z][a-z0-9_]*
        let val='';
        if ((this.ch>='a' && this.ch<='z') || (this.ch>='A' && this.ch<='Z')) {
            val += this.ch
            this.next()
        } else {
            this.error('Syntax Error: expected word')
        }
        while((this.ch>='a' && this.ch<='z') 
            || (this.ch>='A' && this.ch<='Z') 
            || (this.ch>='0' && this.ch<='9') 
            || this.ch=='_'
        ) {
            val += this.ch
            this.next()
        }
        return val
    }

    boolOrNull(tagName)
    {
        let w = this.word()
        if (!w || typeof w !== 'string') {
            this.error('Syntax error: expected boolean or null, got "'+w+'"')
        }
        switch(w.toLowerCase()) {
            case 'true':
                if (tagName && tagName!=='boolean') {
                    this.typeError(tagName,w)
                }
                return true
            break
            case 'false':
                if (tagName && tagName!=='boolean') {
                    this.typeError(tagName,w)
                }
                return false 
            break
            case 'null':
                return null
            break
            default:
                this.error('Syntax error: expected boolean or null, got "'+w+'"')
            break
        }
    }

    checkUnresolved(item, object, key)
    {
        if (JSONTag.getType(item)==='link') {
            let link = ''+item
            let links = this.meta.unresolved.get(link)
            if (typeof links === 'undefined') {
                this.meta.unresolved.set(link,[])
                links = this.meta.unresolved.get(link)
            }
            links = links.filter(l => l.key!=key || l.src.deref()!=object)
            links.push({
                src: new WeakRef(object),
                key: key
            })
            this.meta.unresolved.set(link, links)
        }
    }

    removeUnresolved(item, object, key)
    {
        if (JSONTag.getType(item)==='link') {
            let link = ''+item
            let links = this.meta.unresolved.get(link)
            if (typeof links === 'undefined') {
                return
            }
            links = links.filter(l => l.key!=key || l.src.deref()!=object)
            if (links.length) {
                this.meta.unresolved.set(link, links)
            } else {
                this.meta.unresolved.delete(link)
            }
        }            
    }

    array()
    {
        let item, array = []
        if (this.ch !== '[') {
            this.error("Syntax error")
        }
        this.next('[')
        this.whitespace()
        if (this.ch===']') {
            this.next(']')
            return array
        }
        while(this.ch) {
            item = this.value()
            this.checkUnresolved(item, array, array.length)
            array.push(item)
            this.whitespace()
            if (this.ch===']') {
                this.next(']')
                return array
            }
            this.next(',')
            this.whitespace()
        }
        this.error("Input stopped early")
    }

    object()
    {
        let key, val, object={}
        if (this.ch !== '{') {
            this.error("Syntax Error")
        }
        this.next('{')
        this.whitespace()
        if (this.ch==='}') {
            this.next('}')
            return object
        }
        while(this.ch) {
            key = this.string()
            if (key==='__proto__') {
                this.error("Attempt at prototype pollution")
            }
            this.whitespace()
            this.next(':')
            val = this.value()
            object[key] = val
            this.checkUnresolved(val, object, key)
            this.whitespace()
            if (this.ch==='}') {
                this.next('}')
                return object
            }
            this.next(',')
            this.whitespace()
        }
        this.error("Input stopped early")
    }

    value()
    {
        let tagOb, result, tagName;
        this.whitespace()
        if (this.ch==='<') {
            tagOb = this.tag()
            tagName = tagOb.tagName
            this.whitespace()
        }
        switch(this.ch) {
            case '{':
                if (tagName && tagName!=='object') {
                    this.typeError(tagName, this.ch)
                }
                result = this.object()
            break
            case '[':
                if (tagName && tagName!=='array') {
                    this.typeError(tagName, this.ch)
                }
                result = this.array()
            break
            case '"':
                result = this.string(tagName)
            break
            case '-':
                result = this.number(tagName)
            break
            default:
                if (this.ch>='0' && this.ch<='9') {
                    result = this.number(tagName)
                } else {
                    result = this.boolOrNull(tagName)
                }
            break
        }
        if (tagOb) {
            if (result === null) {
                result = new Null()
            }
            if (typeof result !== 'object') {
                switch(typeof result) {
                    case 'string':
                        result = new String(result)
                        break
                    case 'number':
                        result = new Number(result)
                        break
                    default:
                        this.error('Syntax Error: unexpected type '+(typeof result))
                        break
                }
            }
            if (tagOb.tagName) {
                JSONTag.setType(result, tagOb.tagName)
            }
            if (tagOb.attributes) {
                JSONTag.setAttributes(result, tagOb.attributes)
                if (tagOb.attributes?.id) {
                    this.meta.index.id.set(tagOb.attributes.id, new WeakRef(result))
                }
            }
        }
        return result
    }

    walk(holder, key, reviver)
    {
        var k;
        var v;
        var value = holder[key];
        if (value !== null 
            && typeof value === "object" 
            && !(value instanceof String 
            || value instanceof Number
            || value instanceof Boolean)
        ) {
            for (k in value) {
                if (Object.prototype.hasOwnProperty.call(value, k)) {
                    v = this.walk(value, k, reviver);
                    if (v !== undefined 
                        && ( typeof value[k] === 'undefined' || value[k]!==v) )
                    {
                        let oldV = value[k]
                        value[k] = v;
                        if (JSONTag.getType(v)==='link') {
                            this.removeUnresolved(oldV, value, k)
                            this.checkUnresolved(v, value, k)
                        }
                    } else if (v === undefined) {
                        delete value[k];
                    }
                }
            }
        }
        return reviver.call(holder, key, value, this.meta);
    }

    replaceLink(u,value)
    {
        if (typeof value !== 'undefined') {
            let src = u.src.deref()
            if (typeof src!== 'undefined' && JSONTag.getType(src[u.key])==='link') {
                src[u.key] = value
                return true
            }
        }
    }

    resolveLinks()
    {
        if (this.meta.index.id.size>this.meta.unresolved.size) {
            this.meta.unresolved.forEach((links,id) => {
                let value = this.meta.index.id.get(id)?.deref()
                if (value!==undefined) {
                    links.forEach((u,i) => {
                        if (this.replaceLink(u,value)) {
                            delete links[i]
                        }
                    })
                }
            })
        } else {
            this.meta.index.id.forEach((ref,id) => {
                let value = ref.deref()
                let links = this.meta.unresolved.get(id)
                if (value!==undefined && typeof links !== 'undefined') {
                    links.forEach((u) => {
                        this.replaceLink(u,value)
                    })
                    this.meta.unresolved.delete(id)
                }
            })
        }
    }

    parse(input, reviver)
    {
        this.at = 0
        this.ch = " "
        this.input = input
        const result = this.value()
        this.whitespace()
        if (this.ch) {
            this.error("Syntax error")
        }
        if (typeof reviver == 'function') {
            this.walk({"":result}, "", reviver)
        }
        this.resolveLinks()
        return result
    }
}

export class SyntaxError extends Error
{
    constructor(message, parser)
    {
        super(message)
        this.input = parser.input.substring(parser.at-100,parser.at+100)
        this.at = parser.at
    }
}
