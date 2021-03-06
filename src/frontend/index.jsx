import React from "react"
import { render } from "react-dom"
import { observable, action } from "mobx"
import { observer } from "mobx-react"

require("./styling.css")

import rental from "../../../rental-ast/rental"

const indefiniteArticleFor = (nextword) => "a" + 
    ((typeof nextword === "string" && nextword.match(/^[aeiou]/))? "n" : "")

import { isAstObject } from "../../../rental-ast/ast"
import { TextValue, NumberValue, DropDownValue } from "./value-components"
import { Selectable } from "./selectable"

const placeholderAstObject = "<placeholder for an AST object>"

const AddNewButton = ({ buttonText, actionFunction }) => 
    <button
        className="add-new"
        tabIndex={-1}
        onClick={action((event) => {
            event.stopPropagation()
            actionFunction()
        })}
        >{buttonText}</button>


const Projection = observer(({ value, deleteValue, ancestors }) => {
    if (isAstObject(value)) {
        const { settings } = value
        const editStateFor = (propertyName) => observable({
            value: settings[propertyName],
            inEdit: false,
            setValue: (newValue) => { settings[propertyName] = newValue }
        })
        // (cases are in alphabetical order of concept labels:)
        switch (value.concept) {
            case "Attribute Reference": {
                const recordType = ancestors.find((ancestor) => ancestor.concept === "Record Type")
                const attributes = recordType.settings["attributes"]
                return <Selectable 
                            className="inline" 
                            astObject={value}
                            deleteAstObject={deleteValue}>
                            <span className="keyword">the</span>
                            <DropDownValue
                                editState={observable({
                                    value: settings["attribute"] && settings["attribute"].ref.settings["name"],
                                    inEdit: false,
                                    setValue: (newValue) => {
                                        settings["attribute"] = {
                                            ref: attributes.find((attribute) => attribute.settings["name"] === newValue )
                                        }
                                    }
                                })}
                                className="data-reference"
                                options={attributes
                                    .map((attribute) => attribute.settings["name"])
                                }
                                actionText="(choose an attribute to reference)" 
                                placeholderText="<attribute>"
                            />
                        </Selectable>
            }
            case "Data Attribute": 
                return <Selectable
                            className="attribute"
                            astObject={value}
                            deleteAstObject={deleteValue}>
                            <span className="keyword">the</span>&nbsp;
                            <TextValue editState={editStateFor("name")} placeholderText="<name>" />&nbsp;
                            <span className="keyword">is {indefiniteArticleFor(settings["type"])}</span>&nbsp;
                            <DropDownValue
                                className="value quoted-type"
                                editState={editStateFor("type")}
                                options={[ "amount", "percentage", "period in days" ]}
                                placeholderText="<type>"
                            />&nbsp;
                            {settings["initial value"] ?
                                <div className="inline">
                                    <span className="keyword">initially</span>&nbsp;
                                    {settings["initial value"] === placeholderAstObject
                                    ? <DropDownValue
                                        editState={observable({
                                            inEdit: true,
                                            setValue: (newValue) => {
                                                settings["initial value"] = {
                                                    concept: newValue,
                                                    settings: {}
                                                }
                                            }
                                        })}
                                        options={[
                                            "Attribute Reference",
                                            "Number Literal"
                                        ]}
                                        placeholderText="<initial value>"
                                        actionText="(choose concept for initial value)"
                                        />
                                    : <Projection value={settings["initial value"]} ancestors={[ value, ...ancestors ]} 
                                    deleteValue={() => {
                                        delete settings["initila value"]
                                    }}
                                    />
                                    }
                                </div>
                                : <AddNewButton
                                    buttonText="+ initial value"
                                    actionFunction={() => {
                                        settings["initial value"] = placeholderAstObject
                                    }} />   
                            }
                            </Selectable>

            case "Number Literal": {
                const attribute = ancestors.find((ancestor) => ancestor.concept === "Data Attribute")
                const attributeType = attribute.settings["type"]
                return <Selectable
                            className="inline"
                            astObject={value}
                            deleteAstObject={deleteValue}>
                            {attributeType === "amount" && <span className="keyword">$</span>}
                            <NumberValue editState={editStateFor("value")} placeholderText="<number>" />
                            {attributeType === "percentage" && <span className="keyword">%</span>}
                            {attributeType === "period in days" && <span className="keyword">&nbsp;days</span>}
                        </Selectable>
            }
            
            case "Record Type": return <Selectable astObject={value}>
                    <div>
                        <span className="keyword">Record Type</span>&nbsp;
                        <TextValue editState={editStateFor("name")} placeholderText="<name>" />
                    </div>
                    <div className="attributes">
                        <div><span className="keyword">attributes:</span></div>
                        {settings["attributes"].map((attribute, index) => 
                            <Projection 
                                value={attribute} 
                                key={index} 
                                ancestors={[ value, ...ancestors ]}
                                deleteValue={() => {
                                    settings["attributes"].splice(index, 1)
                                }}
                                />
                        )}
                        <AddNewButton 
                            buttonText="+ attribute"
                            actionFunction={() => {
                                settings["attributes"].push({
                                    concept: "Data Attribute",
                                    settings: {}
                                })
                            }} />
                    </div>
                </Selectable>
            default: return <div>
                <em>{"No projection defined for concept: " + value.concept}</em>
            </div>
        }
    }
    return <em>{"No projection defined for value: " + value}</em>
})


render(
    <Projection value={observable(rental)} ancestors={[]} />,
    document.getElementById("root")
)

