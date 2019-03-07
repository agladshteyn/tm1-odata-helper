"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util_1 = require("util");
var DisplayType;
(function (DisplayType) {
    DisplayType[DisplayType["None"] = 0] = "None";
    DisplayType[DisplayType["Name"] = 1] = "Name";
    DisplayType[DisplayType["Alias"] = 2] = "Alias";
    DisplayType[DisplayType["Value"] = 3] = "Value";
    DisplayType[DisplayType["Comment"] = 4] = "Comment";
})(DisplayType || (DisplayType = {}));
;
var PropertyType;
(function (PropertyType) {
    PropertyType[PropertyType["Unknown"] = 0] = "Unknown";
    PropertyType[PropertyType["String"] = 1] = "String";
    PropertyType[PropertyType["Number"] = 2] = "Number";
    PropertyType[PropertyType["Array"] = 3] = "Array";
    PropertyType[PropertyType["Object"] = 4] = "Object";
    PropertyType[PropertyType["Boolean"] = 5] = "Boolean";
})(PropertyType || (PropertyType = {}));
;
var DisplaySize;
(function (DisplaySize) {
    DisplaySize[DisplaySize["Large"] = 0] = "Large";
    DisplaySize[DisplaySize["Medium"] = 1] = "Medium";
    DisplaySize[DisplaySize["Small"] = 2] = "Small";
})(DisplaySize = exports.DisplaySize || (exports.DisplaySize = {}));
;
/**
 * Primary responsibility of this class is to map values specified in the markdown
 * to the actual object properties.
 */
class PropertyMapper {
    /**
     * Returns the property type matching the specified name within the given object.
     */
    static getPropertyType(targetObj, propName) {
        let property = Reflect.get(targetObj, propName);
        if (util_1.isNullOrUndefined(property))
            return PropertyType.Unknown;
        if (typeof property === "string")
            return PropertyType.String;
        if (typeof property === "object") {
            if (Array.isArray(property))
                return PropertyType.Array;
            else
                return PropertyType.Object;
        }
        if (util_1.isNumber(property))
            return PropertyType.Number;
        return PropertyType.Unknown;
    }
    static getProperty(targetObj, propName) {
        let propertyInfo = null;
        if (util_1.isNullOrUndefined(targetObj) || util_1.isNullOrUndefined(propName) || propName.length === 0)
            return propertyInfo;
        let propertyValue = Reflect.get(targetObj, propName);
        if (util_1.isNullOrUndefined(propertyValue))
            return propertyInfo;
        propertyInfo = new PropertyInfo();
        propertyInfo.DisplaySize = DisplaySize.Medium;
        propertyInfo.Name = propName;
        propertyInfo.Type = this.getPropertyType(targetObj, propName);
        let metadataValue = Reflect.getMetadata("Comment", targetObj, propName);
        if (metadataValue === true) {
            propertyInfo.DisplayType = DisplayType.Comment;
            return propertyInfo;
        }
        // If this property is an array, get the element type information.
        if (propertyInfo.Type === PropertyType.Array) {
            let elemType = Reflect.getMetadata("ElementType", targetObj, propName);
            if (!util_1.isNullOrUndefined(elemType))
                propertyInfo.ArrayElementType = elemType;
        }
        metadataValue = Reflect.getMetadata("Alias", targetObj, propName);
        if (!util_1.isNullOrUndefined(metadataValue))
            propertyInfo.Alias = metadataValue;
        metadataValue = Reflect.getMetadata("DisplaySize", targetObj, propName);
        if (!util_1.isNullOrUndefined(metadataValue))
            propertyInfo.DisplaySize = metadataValue;
        metadataValue = Reflect.getMetadata("Placeholder", targetObj, propName);
        if (!util_1.isNullOrUndefined(metadataValue))
            propertyInfo.Placeholder = metadataValue;
        metadataValue = Reflect.getMetadata("Position", targetObj, propName);
        if (!util_1.isNullOrUndefined(metadataValue)) {
            let pos = Number.parseInt(metadataValue);
            if (!isNaN(pos))
                propertyInfo.Position = pos;
        }
        metadataValue = Reflect.getMetadata("ValueRange", targetObj, propName);
        if (!util_1.isNullOrUndefined(metadataValue) && Array.isArray(metadataValue))
            propertyInfo.ValueRange = metadataValue;
        // Checks if this property is decorated with a value specifying alternate properties that will receive the value
        // specified on the same line as this property.
        // Example:
        //      ## ODBC: tm1userdsn
        // Assume the current property name is "Type". In example above, "ODBC" is one of the allowed values for the "Type" property.
        // In the above example, our property "Type" will receive the value of "ODBC" and value "tm1userdsn" will be received by
        // alternate properties, if any have been specified using "AltValueDestinations" decorator on the "Type" property.
        metadataValue = Reflect.getMetadata("AltValueDestinations", targetObj, propName);
        if (!util_1.isNullOrUndefined(metadataValue) && Array.isArray(metadataValue)) { // Property names are specified as an array
            let array = metadataValue;
            for (let value of array) {
                let altValueDest = PropertyMapper.getProperty(targetObj, value);
                if (!util_1.isNullOrUndefined(altValueDest))
                    propertyInfo.AltValueDestinations.push(altValueDest);
            }
        }
        let isDisplayed = true;
        let propNames = this.getOwnPropertyNames(targetObj).filter(name => name !== propName);
        for (let name of propNames) {
            metadataValue = Reflect.getMetadata("AltValueDestinations", targetObj, name);
            if (!util_1.isNullOrUndefined(metadataValue) && Array.isArray(metadataValue)) {
                let array = metadataValue;
                let idx = array.indexOf(propName);
                if (idx !== -1) {
                    isDisplayed = false;
                    break;
                }
            }
        }
        if (!isDisplayed)
            propertyInfo.DisplayType = DisplayType.None;
        else {
            // Set property display type based on certain decorators. Display type value specifies how this property
            // is displayed in the markdown. Sometimes just the property name is displayed (most common way), at other times
            // property is displayed by its actual value.
            if (propertyInfo.hasValueRange())
                propertyInfo.DisplayType = DisplayType.Value;
            else {
                if (propertyInfo.hasAlias())
                    propertyInfo.DisplayType = DisplayType.Alias;
                else
                    propertyInfo.DisplayType = DisplayType.Name;
            }
        }
        if (propertyInfo.DisplayType === DisplayType.Alias && propertyInfo.hasAlias())
            propertyInfo.DisplayName = propertyInfo.Alias;
        else if (propertyInfo.DisplayType === DisplayType.Value)
            propertyInfo.DisplayName = propertyValue;
        else
            propertyInfo.DisplayName = propertyInfo.Name;
        // Property description that will appear as a comment in the markdown.
        metadataValue = Reflect.getMetadata("Description", targetObj, propName);
        if (!util_1.isNullOrUndefined(metadataValue))
            propertyInfo.Description = metadataValue;
        return propertyInfo;
    }
    /**
     * Uses the specified tag name to find a matching property within the given object using the supported property decorators and the rules.
     */
    static findOwnProperty(targetObj, tagName) {
        if (util_1.isNullOrUndefined(targetObj) === false && util_1.isNullOrUndefined(tagName) === false && tagName.length > 0) {
            for (let prop of this.getOwnProperties(targetObj)) {
                // See if the alias matches the tag name.
                if (prop.hasAlias() && prop.Alias === tagName)
                    return prop;
                else if (prop.hasValueRange()) {
                    // Now try to match by value. If this property has a set of allowed values specified,
                    // see if one of them matches the tag name.
                    let idx = prop.ValueRange.findIndex(x => x === tagName);
                    if (idx !== -1) // If matched by value, return the property
                        return prop;
                }
                // If have not found a property yet, try to match by actual name, where specified tag name matches the property name.
                if (prop.Name === tagName)
                    return prop;
            }
        }
        return null;
    }
    static getOwnPropertyNames(targetObj) {
        if (util_1.isNullOrUndefined(targetObj))
            return null;
        return Object.getOwnPropertyNames(targetObj).filter(prop => !util_1.isNullOrUndefined(targetObj[prop]) && typeof targetObj[prop] !== "function");
    }
    static findFirstPropertyByDisplayType(targetObj, displayType) {
        for (let prop of this.getOwnProperties(targetObj)) {
            if (prop.DisplayType === displayType)
                return prop;
        }
        return null;
    }
    /**
     * Returns a list of immediate (own) properties of the specified object.
     */
    static getOwnProperties(targetObj) {
        let propNames = this.getOwnPropertyNames(targetObj);
        let props = new Array();
        for (let propName of propNames)
            props.push(PropertyMapper.getProperty(targetObj, propName));
        return props;
    }
    /**
     * Returns object properties in the order they have been defined. Property position within an object
     * may be changed using "Position" decorator on the property.
     */
    static getPositionalProperties(targetObj) {
        if (util_1.isNullOrUndefined(targetObj))
            return null;
        let propNames = this.getOwnPropertyNames(targetObj);
        let props = new Array(propNames.length);
        let decoratedPropertyIndexes = [];
        // First, add properties that explicitly have position number defined.
        let propIdx = 0;
        let allProperties = this.getOwnProperties(targetObj);
        for (let prop of allProperties) {
            if (prop.hasPosition()) {
                props[prop.Position] = prop;
                decoratedPropertyIndexes.push(propIdx);
            }
            propIdx++;
        }
        // Now iterate over the non-decorated properties and add those.
        let emptySlotIndexes = [];
        for (let i = 0; i < props.length; i++) {
            if (util_1.isUndefined(props[i]))
                emptySlotIndexes.push(i);
        }
        let slotIdx = 0;
        propIdx = 0;
        for (let prop of allProperties) {
            if (decoratedPropertyIndexes.indexOf(propIdx) === -1) { // If not a decorated property
                props[emptySlotIndexes[slotIdx++]] = prop;
            }
            propIdx++;
        }
        return props;
    }
    /**
     * Makes a value for a property of a simple type (string or number) using the values specified in the markdown line.
     */
    static makeSimpleValue(propertyInfo, parser) {
        if (propertyInfo.Type === PropertyType.String || propertyInfo.Type === PropertyType.Number) {
            let value;
            if (propertyInfo.DisplayType === DisplayType.Value)
                value = parser.Tag;
            else
                value = parser.Value;
            if (propertyInfo.Type === PropertyType.Number) {
                let num = Number.parseFloat(value);
                if (!isNaN(num))
                    return num;
            }
            else
                return value;
        }
        return null;
    }
    /**
     * Converts the specified string value into the same data type as the property.
     */
    static makePropertyValue(propertyInfo, parser) {
        if (!util_1.isNullOrUndefined(propertyInfo) && !util_1.isNullOrUndefined(parser) && propertyInfo.Type !== PropertyType.Unknown) {
            if (propertyInfo.Type === PropertyType.String || propertyInfo.Type === PropertyType.Number)
                return this.makeSimpleValue(propertyInfo, parser);
            else if (propertyInfo.Type === PropertyType.Array) {
                // Create a new array element of the proper type and set its property values.
                if (!util_1.isNullOrUndefined(propertyInfo.ArrayElementType)) {
                    let arrElem = Object.create(propertyInfo.ArrayElementType);
                    Object.assign(arrElem, arrElem.__proto__);
                    // If we have a tag name, try to find a matching property in the array element instance.
                    // In the following example, "String" is the tag name:
                    //      String:   pFiscalYear,2019,Fiscal Year
                    // That tag name can represent either the actual property name or a property value. 
                    // We use our mapping routine to determine that.
                    let arrElemProperty;
                    if (parser.hasTagName()) {
                        arrElemProperty = this.findOwnProperty(arrElem, parser.Tag);
                        if (!util_1.isNullOrUndefined(arrElemProperty)) {
                            // If found a matching property, set its value.
                            let value = this.makeSimpleValue(arrElemProperty, parser);
                            if (!util_1.isNullOrUndefined(value))
                                arrElemProperty.setValue(value, arrElem, false); // Set property value
                        }
                    }
                    // Now set the rest of the property values of the array element by position. 
                    // Example of a line representing an array element:
                    //      String:   pFiscalYear,2019,Fiscal Year
                    // The following part represents the property values of the array element: pFiscalYear,2019,Fiscal Year
                    // They are separated by a comma(,) and we need to match the values to properties by their positions.
                    if (parser.hasValue()) {
                        let values = parser.Value.split(",");
                        if (values.length > 0) {
                            let props = this.getPositionalProperties(arrElem); // Get properties in the positional order
                            if (arrElemProperty) // Filter out the property that we have already processed
                                props = props.filter(prop => prop.Name !== arrElemProperty.Name);
                            if (props.length > 0) {
                                // Set property values using positions.
                                let propIdx = 0;
                                for (let value of values) {
                                    if (propIdx >= props.length)
                                        break;
                                    let cleanValue = value;
                                    if (props[propIdx].isString())
                                        cleanValue = cleanValue.trimLeft();
                                    let prop = props[propIdx];
                                    if (prop.isNumber()) {
                                        cleanValue = Number.parseFloat(cleanValue);
                                        if (isNaN(cleanValue))
                                            cleanValue = 0;
                                    }
                                    if (prop.hasPlaceholder() && prop.Placeholder === cleanValue)
                                        prop.clearValue(arrElem);
                                    else
                                        prop.setValue(cleanValue, arrElem, false);
                                    propIdx++;
                                }
                            }
                        }
                    }
                    return arrElem;
                }
            }
        }
        return null;
    }
}
/**
 * This class is used to describe a property of an object.
 */
class PropertyInfo {
    constructor() {
        this.Position = -1;
        this.AltValueDestinations = [];
        this.ValueRange = [];
    }
    hasPlaceholder() {
        return !util_1.isNullOrUndefined(this.Placeholder) && this.Placeholder.length > 0;
    }
    hasName() {
        return !util_1.isNullOrUndefined(this.Name) && this.Name.length > 0;
    }
    hasDesc() {
        return !util_1.isNullOrUndefined(this.Description) && this.Description.length > 0;
    }
    hasAlias() {
        return !util_1.isNullOrUndefined(this.Alias) && this.Alias.length > 0;
    }
    isString() {
        return this.Type === PropertyType.String;
    }
    isArray() {
        return this.Type === PropertyType.Array;
    }
    isObject() {
        return this.Type === PropertyType.Object;
    }
    isNumber() {
        return this.Type === PropertyType.Number;
    }
    isBoolean() {
        return this.Type === PropertyType.Boolean;
    }
    hasValueRange() {
        return !util_1.isNullOrUndefined(this.ValueRange) && this.ValueRange.length > 0;
    }
    hasAltValueDestinations() {
        return !util_1.isNullOrUndefined(this.AltValueDestinations) && this.AltValueDestinations.length > 0;
    }
    hasPosition() {
        return this.Position !== -1;
    }
    getValue(targetObj) {
        if (!util_1.isNullOrUndefined(targetObj))
            return Reflect.get(targetObj, this.Name);
        return null;
    }
    setOrClearValue(value, targetObj, clear, append) {
        if (this.Type !== PropertyType.Unknown && Reflect.has(targetObj, this.Name)) {
            if (this.hasPlaceholder() && this.Placeholder === value)
                clear = true;
            if (this.Type === PropertyType.Number) {
                if (clear)
                    Reflect.set(targetObj, this.Name, 0);
                else
                    Reflect.set(targetObj, this.Name, value);
            }
            else if (this.Type === PropertyType.Array) {
                let array = Reflect.get(targetObj, this.Name);
                if (clear) {
                    array = [];
                    Reflect.set(targetObj, this.Name, array);
                }
                else
                    array.push(value);
            }
            else if (this.Type === PropertyType.String && !util_1.isNullOrUndefined(value)) {
                let strValue = Reflect.get(targetObj, this.Name);
                if (util_1.isNullOrUndefined(strValue))
                    strValue = "";
                if (append)
                    strValue += value;
                else
                    strValue = value;
                if (clear)
                    strValue = "";
                Reflect.set(targetObj, this.Name, strValue);
            }
        }
    }
    setValue(value, targetObj, append) {
        this.setOrClearValue(value, targetObj, false, append);
    }
    clearValue(targetObj) {
        this.setOrClearValue(null, targetObj, true, false);
    }
    isSimpleType() {
        return this.isString() || this.isNumber() || this.isBoolean();
    }
}
class ObjectContainer {
    constructor(parent, instance) {
        this.Parent = parent;
        this.Instance = instance;
    }
}
class ObjectCursor {
    constructor(instance) {
        this.Object = new ObjectContainer(null, instance);
        this.Depth = 0;
    }
    setValue(value, append, clear, propInfo) {
        if (clear)
            propInfo.clearValue(this.Object.Instance);
        else
            propInfo.setValue(value, this.Object.Instance, append);
    }
    clearPropertyValue() {
        if (this.hasObject() && this.hasProperty())
            this.setValue(null, false, true, this.PropertyInfo);
    }
    updatePropertyValue(value, append) {
        if (this.hasObject() && this.hasProperty())
            this.setValue(value, append, false, this.PropertyInfo);
    }
    updateAltValueDestinations(value) {
        if (this.hasProperty() && this.hasObject() && this.PropertyInfo.hasAltValueDestinations() && !util_1.isNullOrUndefined(value)) {
            let clear = false;
            let idx = this.PropertyInfo.AltValueDestinations.findIndex(prop => prop.hasPlaceholder() && prop.Placeholder === value);
            if (idx !== -1)
                clear = true;
            for (let propInfo of this.PropertyInfo.AltValueDestinations) {
                this.setValue(value, false, clear, propInfo);
            }
        }
    }
    hasObject() {
        return util_1.isNullOrUndefined(this.Object) === false && util_1.isNullOrUndefined(this.Object.Instance) === false;
    }
    next(tagName) {
        let result = false;
        this.PropertyInfo = PropertyMapper.findOwnProperty(this.Object.Instance, tagName);
        // If did not find an own property by the tag name, go one level deeper and try to find a property
        // in one of the object-type members of this instance.
        if (this.PropertyInfo === null) {
            for (let propName of PropertyMapper.getOwnPropertyNames(this.Object.Instance)) {
                let property = this.Object.Instance[propName];
                if (!util_1.isNullOrUndefined(property)) {
                    // If this property is an object, try to find a property by tag name in that object.
                    let isObj = typeof property === "object" && Array.isArray(property) === false;
                    if (isObj === true) {
                        this.PropertyInfo = PropertyMapper.findOwnProperty(property, tagName);
                        if (this.PropertyInfo !== null) { // If found a matching property
                            // Set parent to the current instance so we could re-adjust our cursor to point to it again.
                            this.Object.Parent = this.Object.Instance;
                            // Current object instance becomes the instance that this property belongs to.
                            this.Object.Instance = Object.create(property);
                            Object.assign(this.Object.Instance, this.Object.Instance.__proto__);
                            Reflect.set(this.Object.Parent, propName, this.Object.Instance);
                            this.Depth++;
                            result = true;
                            break;
                        }
                    }
                }
            }
        }
        else
            result = true;
        return result;
    }
    setTo(depth) {
        if (this.hasObject() === false)
            return;
        if (depth < 0)
            depth = 0;
        while (this.Depth > depth) {
            if (util_1.isNullOrUndefined(this.Object.Parent))
                break;
            this.Object.Instance = this.Object.Parent;
            this.Depth--;
        }
        this.PropertyInfo = null;
    }
    hasProperty() {
        return util_1.isNullOrUndefined(this.PropertyInfo) === false && this.PropertyInfo.hasName();
    }
}
class MarkdownParser {
    constructor(text) {
        this.Text = text;
        this.parse();
    }
    parse() {
        if (this.hasText()) {
            // Get indent depth.
            // Count number of trailing spaces.
            let numSpaces = 0;
            for (let char of this.Text) {
                if (char === " ")
                    numSpaces++;
                else
                    break;
            }
            // Calculate indent depth based on the number of spaces.
            this.IndentDepth = numSpaces / MarkdownParser.SpacesPerIndent;
            if (this.IndentDepth < 0)
                this.IndentDepth = 0;
            let regexp;
            if (this.IndentDepth > 0) { // If indented
                // Match example: UserName: MyUser
                // If not prefixed with a pound (#) sign (or two), users can specify property/value as shown in the above example,
                // but this is only valid if the line is indented.
                regexp = /^([a-z0-9]+)[:](.*)/i;
            }
            else { // If not indented
                // Match example 1: # Process: Merchandise - Load Weekly Sales
                // Match example 2: ## Process: Merchandise - Load Weekly Sales
                regexp = /^#[\#]? ([a-z0-9]+)[:](.*)/i;
            }
            let result = regexp.exec(this.Text.trimLeft());
            if (!util_1.isNullOrUndefined(result) && Array.isArray(result) && result.length > 1) {
                this.Tag = result[1];
                // See if value has been specified on the same line. 
                // Example: # Process: Merchandise - Load Weekly Sales
                //      'Key' property would be 'Process'
                //      'Value' property would be 'Merchandise - Load Weekly Sales'
                if (result.length > 2) {
                    this.Value = result[2];
                    if (!util_1.isNullOrUndefined(this.Value) && typeof this.Value === "string") {
                        let strVal = this.Value;
                        if (this.Value.length > 0 && this.Value[0] === " ")
                            this.Value = this.Value.substr(1);
                    }
                }
            }
        }
    }
    hasTagName() {
        return util_1.isNullOrUndefined(this.Tag) === false && this.Tag !== "";
    }
    hasValue() {
        return util_1.isNullOrUndefined(this.Value) === false;
    }
    hasText() {
        return util_1.isNullOrUndefined(this.Text) === false && this.Text !== "";
    }
}
MarkdownParser.SpacesPerIndent = 4; // Single indent is equal to 4 spaces
class Markdown {
    /**
     * Creates an object of the specified type. Populates the object using the specified markdown data.
     */
    deserialize(source, destinationType) {
        if (util_1.isNullOrUndefined(destinationType))
            throw "Destination object type not specified";
        let destination = Object.create(destinationType);
        Object.assign(destination, destination.__proto__);
        let newLine = "\r\n";
        // Remove properties that are meant to display comments as we don't want those in the resulting object.
        let props = PropertyMapper.getOwnProperties(destination).filter(prop => prop.DisplayType === DisplayType.Comment);
        for (let prop of props)
            delete destination[prop.Name];
        let objectCursor = new ObjectCursor(destination);
        // Read the input line by line.
        let lines = source.split(newLine);
        for (let line of lines) {
            let parser = new MarkdownParser(line);
            let isComment = parser.IndentDepth === 0 && !parser.hasTagName();
            if (!isComment && parser.hasText()) {
                let searchForObjProperty = false;
                let appendLineAsText = false;
                // If new depth (indent) is less than the current depth, adjust the object cursor,
                // because this means we are now in the context of a parent object.
                if (parser.IndentDepth < objectCursor.Depth)
                    objectCursor.setTo(parser.IndentDepth);
                if (parser.IndentDepth <= objectCursor.Depth || !objectCursor.hasProperty())
                    searchForObjProperty = true;
                if (searchForObjProperty === false) {
                    if (parser.IndentDepth > objectCursor.Depth) {
                        // If current line is further indented than the previous one, check to see if we are currently
                        // on a property of type string. If that's the case, append the entire line to that property.
                        if (objectCursor.PropertyInfo.isString())
                            appendLineAsText = true;
                        else {
                            // If indent/depth has been incremented by 1, that means we are updating a property of another object instance,
                            // which is a member of the current object. If, however, the current property we are updating is an array and
                            // the line is indented, that means we are appending a new element to that array.
                            if (parser.IndentDepth - objectCursor.Depth === 1 && !(objectCursor.hasProperty() && objectCursor.PropertyInfo.isArray()))
                                searchForObjProperty = true;
                        }
                    }
                }
                // If the current line presumably contains a tag name that points to an object property, try to find that property using the tag name.
                let propertyUpdated = false;
                if (searchForObjProperty === true)
                    propertyUpdated = objectCursor.next(parser.Tag); // Adjust cursor to point to the object property this tag refers to 
                // Now update the property value.
                if (objectCursor.hasProperty()) {
                    if (appendLineAsText === true) {
                        let text = this.removeDepth(objectCursor.Depth + 1, parser.Text) + newLine;
                        objectCursor.updatePropertyValue(text, true); // If appending to a string property
                    }
                    else {
                        let isArray = propertyUpdated && objectCursor.PropertyInfo.isArray();
                        if (!isArray) {
                            // Create a value of the same type as the property we are setting. Use current markdown line to read the data.
                            let value = PropertyMapper.makePropertyValue(objectCursor.PropertyInfo, parser);
                            if (!util_1.isNullOrUndefined(value)) {
                                objectCursor.updatePropertyValue(value, false);
                                if (objectCursor.PropertyInfo.DisplayType === DisplayType.Value && parser.hasValue())
                                    objectCursor.updateAltValueDestinations(parser.Value);
                            }
                        }
                        else {
                            // Clear array before adding elements to it.
                            objectCursor.clearPropertyValue();
                        }
                    }
                }
            }
        }
        return destination;
    }
    propertyPrefix(propertyInfo, depth) {
        let prefix = "";
        if (depth === 0) {
            if (propertyInfo.DisplaySize === DisplaySize.Large)
                prefix = "# ";
            else if (propertyInfo.DisplaySize === DisplaySize.Medium)
                prefix = "## ";
            else // Small
                prefix = "### ";
        }
        else {
            // Add indentation.
            prefix = this.addDepth(depth);
        }
        return prefix;
    }
    addDepth(depth) {
        let str = "";
        for (let i = 0; i < depth * MarkdownParser.SpacesPerIndent; i++)
            str += " ";
        return str;
    }
    removeDepth(depth, value) {
        if (!value)
            return "";
        let trailingSpaceCount = 0;
        let spacesToRemove = depth * MarkdownParser.SpacesPerIndent;
        for (let i = 0; i < value.length; i++) {
            if (trailingSpaceCount >= spacesToRemove)
                break;
            if (value[i] === " ")
                trailingSpaceCount++;
            else
                break;
        }
        return value.substr(trailingSpaceCount);
    }
    getMarkdown(targetObj, depth) {
        let newLine = "\r\n";
        let markdown = "";
        if (util_1.isNullOrUndefined(targetObj))
            return markdown;
        for (let propertyInfo of PropertyMapper.getOwnProperties(targetObj).filter(x => x.DisplayType !== DisplayType.Value
            && x.DisplayType !== DisplayType.None && x.DisplayType !== DisplayType.Comment)) {
            let value = propertyInfo.getValue(targetObj);
            if (propertyInfo.isArray()) { // If array
                if (propertyInfo.hasDesc())
                    markdown += newLine + propertyInfo.Description + newLine;
                markdown += this.propertyPrefix(propertyInfo, depth) + propertyInfo.DisplayName + ":";
                if (!util_1.isNullOrUndefined(value) && Array.isArray(value)) {
                    markdown += newLine;
                    // Create a markdown line for each element in the array.
                    let arr = value;
                    for (let arrElem of arr) {
                        let arrElemStr = "";
                        // See if there is a property with display type of DisplayType.Value
                        // This means a property value is displayed in the markdown instead of the property name.
                        // Example of how it would show up in the markdown:
                        //      "Numeric": ...
                        //      Where "Numeric" is an actual value of a property.
                        let arrElemProps = PropertyMapper.getOwnProperties(arrElem).filter(x => x.DisplayType === DisplayType.Value);
                        if (arrElemProps.length > 0) {
                            let arrElemPropValue = arrElemProps[0].getValue(arrElem);
                            if (!util_1.isNullOrUndefined(arrElemPropValue) && arrElemPropValue !== "")
                                arrElemStr += arrElemPropValue + ": ";
                        }
                        // Append positional values.
                        let positionalProps = PropertyMapper.getPositionalProperties(arrElem).filter(x => x.DisplayType !== DisplayType.Value);
                        let sep = "";
                        for (let positionalProp of positionalProps) {
                            let positionalPropVal = positionalProp.getValue(arrElem);
                            if ((util_1.isNullOrUndefined(positionalPropVal) || positionalPropVal === "") && positionalProp.hasPlaceholder())
                                positionalPropVal = positionalProp.Placeholder;
                            if (!util_1.isNullOrUndefined(positionalPropVal)) {
                                arrElemStr += sep + positionalPropVal;
                                sep = ",";
                            }
                        }
                        if (arrElemStr !== "")
                            markdown += this.addDepth(depth + 1) + arrElemStr + newLine;
                    }
                }
            }
            else if (propertyInfo.isObject()) { // If this property is another object
                if (!util_1.isNullOrUndefined(value)) {
                    // Try to find a property whose value is displayed in the markdown, instead of its name.
                    let prop = PropertyMapper.findFirstPropertyByDisplayType(value, DisplayType.Value);
                    if (!util_1.isNullOrUndefined(prop) && prop.isSimpleType()) {
                        let propStr = "";
                        let propValue = prop.getValue(value);
                        if (!util_1.isNullOrUndefined(propValue) && propValue !== "") {
                            let propStr = "";
                            if (prop.hasDesc())
                                propStr += newLine + prop.Description + newLine;
                            propStr += this.propertyPrefix(propertyInfo, depth) + propValue + ": ";
                            // Alternate value destinations.
                            if (prop.hasAltValueDestinations()) {
                                for (let altValueDest of prop.AltValueDestinations) {
                                    let altValue = altValueDest.getValue(value);
                                    if ((util_1.isNullOrUndefined(altValue) || altValue === "") && altValueDest.hasPlaceholder())
                                        altValue = altValueDest.Placeholder;
                                    if (!util_1.isNullOrUndefined(altValue) && altValue !== "") {
                                        propStr += altValue;
                                        break;
                                    }
                                }
                            }
                            markdown += propStr + newLine;
                            markdown += this.getMarkdown(value, depth + 1);
                        }
                    }
                }
            }
            else {
                if (propertyInfo.hasDesc())
                    markdown += newLine + propertyInfo.Description + newLine;
                markdown += this.propertyPrefix(propertyInfo, depth) + propertyInfo.DisplayName + ":";
                if ((util_1.isNullOrUndefined(value) || value === "") && propertyInfo.hasPlaceholder())
                    value = propertyInfo.Placeholder;
                markdown += " " + value + newLine;
            }
        }
        return markdown;
    }
    /**
     * Generates markdown from the specified object.
     */
    serialize(source) {
        let value = "";
        let commentProp = PropertyMapper.findFirstPropertyByDisplayType(source, DisplayType.Comment);
        if (!util_1.isNullOrUndefined(commentProp)) {
            let comment = commentProp.getValue(source);
            if (!util_1.isNullOrUndefined(comment) && comment !== "")
                value = comment;
        }
        value += this.getMarkdown(source, 0);
        return value;
    }
}
exports.Markdown = Markdown;
//# sourceMappingURL=markdown.js.map