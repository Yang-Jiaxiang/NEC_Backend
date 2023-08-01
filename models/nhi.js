const mongoose = require('mongoose')
const Schema = mongoose.Schema

const nhiSchema = new Schema({
    schedule_id: { type: String, required: true },
    xml_path: { type: String, required: true },
    csv_path: { type: String, required: true },
    called: { type: Boolean, required: true, default: false },
})

module.exports = mongoose.model('nhi', nhiSchema)
