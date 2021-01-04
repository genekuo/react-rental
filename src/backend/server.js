const { readFile, writeFileSync } = require("fs")
const { join } = require("path")

const options = { encoding: "utf8" }

const contentPath = join(__dirname, "contents.json")

let contents = null

readFile(contentPath, options, (_, data) => {
    contents = JSON.parse(data)

    const express = require("express")
    const server = express()

    server.get("/ast", (request, response) => {
        response.json(contents)
    })

    const Parcel = require("parcel-bundler")
    const bundler = new Parcel(join(__dirname, "../frontend/index.html"))
    server.use(bundler.middleware())

    const port = 8080
    server.listen(port, () => {
        console.log(`Server started on: http://localhost:${port}/`)
    })
})