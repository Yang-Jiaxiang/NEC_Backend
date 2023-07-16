const mongoose = require('mongoose')
const Schema = mongoose.Schema

const nhiCardSchema = new Schema({
    CardNo: { type: String, required: true }, //卡片號碼
    Name: { type: String, required: true }, //姓名
    PID: { type: String, required: true }, //身分證
    Birthday: { type: String, required: true }, //生日
    Gender: { type: String, required: true }, //性別
    DeliverDate: { type: String, required: true }, //發卡日期
    VoidFlag: { type: String, required: true }, //發卡日期
    EmergencyPhoneNumber: { type: String, required: true }, //緊急連絡電話
    MEDICAL_TYPE: { type: String, required: true }, //就醫類別 ０１為西醫門診、０２為牙醫門診、０３為中醫門診、０４為急診、０５為住院
    NEW_BORN_MARK: { type: String, required: true }, //新生兒註記
    EXAM_DATE: { type: String, required: true }, //就診日期時間13
    CARD_REMARK: { type: String, required: true }, //補卡註記
    MEDICAL_SEQNO: { type: String, required: true }, //就醫序號
    INSTITUTION_CODE: { type: String, required: true }, //醫療院所代碼
    INSTITUTION_TYPE: { type: String, required: true }, //醫事類別
    MEDICAL_ORDERS_TYPE: { type: String, required: true }, //醫令類別
    MEDICAL_ORDERS_CODE: { type: String, required: true }, //診療項目代號
    BODY_PART: { type: String, required: true }, //診療部位
})

const scheduleSchema = new Schema(
    {
        patientID: { type: String, required: true },
        reportID: { type: String },
        nhiCard: nhiCardSchema,
        StudyInstanceUID: { type: String, required: false },
        accessionNumber: { type: String, required: false },
        procedureCode: { type: String, required: false },
        status: { type: String, required: true },
    },
    { timestamps: true }
)

scheduleSchema.virtual('patient', {
    ref: 'Patient',
    localField: 'patientID',
    foreignField: 'id',
    justOne: true,
})

scheduleSchema.virtual('report', {
    ref: 'Report',
    localField: 'patientID',
    foreignField: 'patientID',
    justOne: true,
})

scheduleSchema.virtual('blood', {
    ref: 'Blood',
    localField: 'patientID',
    foreignField: 'patientID',
    justOne: true,
})

scheduleSchema.set('toJSON', { virtuals: true })

module.exports = mongoose.model('Schedule', scheduleSchema)
