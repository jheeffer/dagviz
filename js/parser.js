class Parser {


    // constructor({ columns, ignore }) {
    //     this.columns = columns ?? {}
    //     this.ignore = ignore ?? {}
    //     this.eventProxy = document.createElement("div");
    // }

    // addEventListener(event, callback) {
    //     this.eventProxy.addEventListener(event, callback);
    // }

    static parse(string, settings) {
        const result = Papa.parse(string, {
            delimiter: "\t",
            header: true,
            skipFirstNLines: 0
        })
        console.log(result);
        
        const { columns, ignore } = settings
        const dataMap = new Map();
        let lastCategory = "";
        dataLine:
        for (const line of result.data) {
            let id = line[columns.id];
            if (!id) continue;
            if (dataMap.has(id)) {
                console.error(`id ${id} already exists. Not adding:`, line);
                continue
            }
            for (const ignoreKey in ignore) {
                if (ignore[ignoreKey].includes(line[columns[ignoreKey]]))
                    continue dataLine;
            }
            const dataNode = { id: id, 
                name: line[columns.name] || id,
                possibleIds: Parser.#parseFormula(line[columns.formula]),
                parents: [], 
                children: [],
                formula: line[columns.formula], 
                uom: line[columns.uom],
                description: line[columns.description],
                source: line[columns.source],
                color: line[columns.category] || lastCategory
            };
            lastCategory = dataNode.color;
            dataMap.set(id, dataNode);
        }

        for (const dataNode of dataMap.values()) {
            if (dataNode.formula === "") continue;
            for (const possibleId of dataNode.possibleIds) {
                if (dataMap.has(possibleId)) {
                    const parentNode = dataMap.get(possibleId);
                    dataNode.parents.push(parentNode)
                    parentNode.children.push(dataNode);
                }
            }
        }
        console.log(Object.fromEntries(dataMap))
        // this.eventProxy.dispatchEvent(new CustomEvent("data", { detail: dataMap }));
        return dataMap;
    }

    static #parseFormula(formula) {
        if (formula == "") return new Set();
        let id = "";
        let ids = new Set();
        // console.log(`parsing ${formula}, ${formula.length}`)
        for (const char of formula) {
            // console.log(`char: ${char.charCodeAt(0)}`)
            if (Parser.#isFormulaIdChar(char.charCodeAt(0))) {
                id += char;
                // console.log(`expanded id to ${id}`);
            } else {
                if (id != "") {
                    ids.add(id);
                    // console.log(`added id ${id}`)
                }
                id = "";
            }
        }
        if (id != "") {
            ids.add(id);
            // console.log(`added id ${id}`)
        }
        return ids;
    }

    static #isFormulaIdChar(charCode) {
        return charCode >= 48 && charCode <= 57 // 0-9
        || charCode >= 65 && charCode <= 90  // A-Z
        || charCode >= 97 && charCode <= 122 // a-z
        || charCode == 95 // _
    } 

}
export { Parser };