const mongoose = require('mongoose')
const Schema = mongoose.Schema

const userSchema = new Schema({
    userId: { type: String, required: false },
    username: { type: String, required: false },
})

const loggerSchema = new Schema({
    user: userSchema,
    remoteAddr: { type: String, required: true },
    method: { type: String, required: true },
    url: { type: String, required: true },
    status: { type: String, required: true },
    contentLength: { type: String, required: false },
    responseTime: { type: String, required: false },
    date: { type: Date, required: true },
    requestData: { type: Object, required: false },
})

module.exports = mongoose.model('logger', loggerSchema)
