const mongoose = require('mongoose')
const Schema = mongoose.Schema

const nhiSchema = new Schema(
    {
        examDate: { type: String, required: true },
        schedule_id: { type: String, required: true },
        xml_path: { type: String, required: true },
        called: { type: Boolean, required: true, default: false },
    },
    { timestamps: true }
)

module.exports = mongoose.model('nhi', nhiSchema)
