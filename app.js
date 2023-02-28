const express = require('express')
const errorHandler = require('./middlewares/errorHandler')
const app = express()

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Error handlers
app.use(errorHandler.notFound)
app.use(errorHandler.mongooseErrors)
if(process.env.ENV === "DEVELOPMENT"){
    app.use(errorHandler.developmentErrors)
} else{
    app.use(errorHandler.productionErrors)
}

module.exports = app