const definitions = {
    object: { valueKind: 'object', json: true, taggable: true },
    array: { valueKind: 'array', json: true, taggable: true },
    string: { valueKind: 'string', json: true, taggable: true },
    number: { valueKind: 'number', json: true, taggable: true },
    boolean: { valueKind: 'boolean', json: true, taggable: false },

    decimal: { valueKind: 'string', taggable: true },
    money: { valueKind: 'string', taggable: true },
    uuid: { valueKind: 'string', taggable: true },
    url: { valueKind: 'string', taggable: true },
    link: { valueKind: 'string', taggable: true },
    date: { valueKind: 'string', taggable: true },
    time: { valueKind: 'string', taggable: true },
    datetime: { valueKind: 'string', taggable: true },
    duration: { valueKind: 'string', taggable: true },
    timestamp: { valueKind: 'number', taggable: true },

    text: { valueKind: 'string', taggable: true },
    blob: { valueKind: 'string', taggable: true },
    color: { valueKind: 'string', taggable: true },
    email: { valueKind: 'string', taggable: true },
    hash: { valueKind: 'string', taggable: true },
    phone: { valueKind: 'string', taggable: true },
    range: { valueKind: 'string', taggable: true },

    int: { valueKind: 'number', taggable: true },
    int8: { valueKind: 'number', taggable: true },
    int16: { valueKind: 'number', taggable: true },
    int32: { valueKind: 'number', taggable: true },
    int64: { valueKind: 'number', taggable: true },

    uint: { valueKind: 'number', taggable: true },
    uint8: { valueKind: 'number', taggable: true },
    uint16: { valueKind: 'number', taggable: true },
    uint32: { valueKind: 'number', taggable: true },
    uint64: { valueKind: 'number', taggable: true },

    float: { valueKind: 'number', taggable: true },
    float32: { valueKind: 'number', taggable: true },
    float64: { valueKind: 'number', taggable: true }
}

Object.values(definitions).forEach(Object.freeze)

export const typeDefinitions = Object.freeze(definitions)
export const valueTypes = Object.freeze(Object.keys(typeDefinitions))
export const types = Object.freeze(valueTypes.filter(type => typeDefinitions[type].taggable))
export const jsonTypes = Object.freeze(valueTypes.filter(type => typeDefinitions[type].json))
export const stringTypes = Object.freeze(valueTypes.filter(type => typeDefinitions[type].valueKind==='string'))
export const numberTypes = Object.freeze(valueTypes.filter(type => typeDefinitions[type].valueKind==='number'))

export function getTypeDefinition(type)
{
    return typeDefinitions[type]
}

export function getTypeValueKind(type)
{
    return typeDefinitions[type]?.valueKind
}

export function isKnownType(type)
{
    return typeof typeDefinitions[type] !== 'undefined'
}

export function isTagType(type)
{
    return typeDefinitions[type]?.taggable===true
}
