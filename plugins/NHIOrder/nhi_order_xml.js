const express = require('express')
const router = express.Router()
const SCHEDULE = require('../../models/schedule')
const xml = require('xml')
const fs = require('fs')
const path = require('path')
const NHI = require('./models/nhi')
const REPORT = require('../../models/report')

router.route('/').get(async (req, res) => {
    try {
        const { rangeTime } = req.query

        if (!rangeTime) {
            return res.status(400).json({ error: 'Missing rangeTime' })
        }
        //rangeTime example : 20230101-20231231:string
        const [startDate, endDate] = rangeTime.split('-').map((dateString) => {
            const year = dateString.slice(0, 4)
            const month = dateString.slice(4, 6) - 1 // Month is zero-based
            const day = dateString.slice(6, 8)
            return new Date(year, month, day)
        })

        const schedules = await SCHEDULE.aggregate([
            { $match: { createdAt: { $gte: startDate, $lte: endDate }, status: 'finish', nhiCard: { $exists: true } } },
        ])

        const nhis = await NHI.find()

        const current_schedules = schedules.filter(
            (schedule) => nhis.filter((nhi) => nhi.schedule_id !== schedule._id).length === 0
        )

        const dateNow = new Date().toISOString().slice(0, 10).replace(/-/g, '')

        for (const schedule of current_schedules) {
            const createdAt = schedule.createdAt.toISOString().slice(0, 10).replace(/-/g, '')
            const filePath = `order_nhi_xml/${schedule.nhiCard.EXAM_DATE.substr(0, 5)}/${createdAt}_${
                schedule.patientID
            }_${schedule.accessionNumber}.xml`
            const reportText = await getReportText({
                reportID: schedule.reportID,
                StudyInstanceUID: schedule.StudyInstanceUID,
                accessionNumber: schedule.accessionNumber,
            })
            const xmlData = transFormXML({ schedule, reportText })

            // 获取目录路径
            const directoryPath = path.dirname(filePath)

            // 检查目录路径是否存在，如果不存在则创建
            if (!fs.existsSync(directoryPath)) {
                fs.mkdirSync(directoryPath, { recursive: true })
            }

            const projectBasePath = path.join(path.resolve(__dirname), '../..') + '/'

            const xml_path = await writeXMLFile({ filePath, xmlData })

            let NHIdata = new NHI({
                examDate: schedule.nhiCard.EXAM_DATE.substr(0, 7),
                schedule_id: schedule._id,
                xml_path: projectBasePath + xml_path,
                called: false,
            })
            NHIdata = await NHIdata.save()
        }

        const nhiXMLresults = await NHI.aggregate([{ $match: { createdAt: { $gte: startDate, $lte: endDate } } }])

        return res.status(200).json(nhiXMLresults)
    } catch (e) {
        return res.status(500).json({ message: e.message })
    }
})

/**
 *
 * @param {reportID,StudyInstanceUID, accessionNumber} param0
 * @returns report content:string
 */
const getReportText = async ({ reportID, StudyInstanceUID, accessionNumber }) => {
    const originalReport = await REPORT.findOne({ _id: reportID })
    const report = {
        ...originalReport.toObject(),
        records: originalReport.records.pop(),
        StudyInstanceUID,
        accessionNumber,
    }
    return formatReport(report)
}

const transFormXML = ({ schedule, reportText }) => {
    var example3 = [
        {
            patient: [
                {
                    hdata: [
                        { h1: process.env.NHIORDERXML_ReportType },
                        { h2: schedule.nhiCard.INSTITUTION_CODE },
                        { h3: schedule.nhiCard.INSTITUTION_TYPE },
                        { h4: schedule.nhiCard.EXAM_DATE.substr(0, 5) },
                        { h5: schedule.nhiCard.EXAM_DATE },
                        { h6: schedule.nhiCard.MEDICAL_TYPE },
                        { h7: schedule.nhiCard.MEDICAL_SEQNO },
                        { h8: schedule.nhiCard.CARD_REMARK },
                        { h9: schedule.nhiCard.PID },
                        { h10: schedule.nhiCard.Birthday },
                        { h11: schedule.nhiCard.EXAM_DATE },
                        { h12: schedule.nhiCard.EXAM_DATE },
                        { h15: schedule.nhiCard.MEDICAL_ORDERS_CODE },
                        // { h16: schedule.nhiCard.MEDICAL_ORDERS_NAME },
                        // { h17: schedule.nhiCard....}
                        // { h18: ...}
                        // { h19: ...}
                        // { h20: ...}
                        // { h21: ...}
                        // { h26: ...}
                        { rdata: [{ r1: '1' }, { r7: reportText.replace(/"/g, '') }] },
                    ],
                },
            ],
        },
    ]

    const xmlData = xml(example3)
    return xmlData
}

const writeXMLFile = ({ filePath, xmlData }) => {
    const customPromise = new Promise((resolve, reject) => {
        fs.writeFile(filePath, xmlData, (err) => {
            if (err) {
                reject(err)
            } else {
                resolve(filePath)
            }
        })
    })
    return customPromise
}

/**
 *
 * @param {*} item report object
 * @returns report text : string
 */
function formatReport(item) {
    let formattedReport = ''
    let summarizeReport = 'summarizeReport：'

    for (let i = 0; i < item.records.summarize.length; i++) {
        summarizeReport +=
            item.records.summarize[i].key +
            ':' +
            item.records.summarize[i].value +
            (i === item.records.summarize.length - 1 ? '。' : '、')
    }

    formattedReport += `patientID: ${item.patientID}\n`
    formattedReport += `reportID: ${item._id}\n`
    formattedReport += `accessionNumber: ${item.accessionNumber}\n`
    formattedReport += `StudyInstanceUID: ${item.StudyInstanceUID}\n`
    formattedReport += `birads: ${JSON.stringify(item.records.birads)}\n`

    formattedReport += summarizeReport + '\n'

    const responseTxt = ['L', 'R'].map((side) => {
        return item.records.report[side].map((entry, index) => {
            return {
                TumorID: side + (parseInt(index) + 1),
                clock: entry.clock,
                distance: entry.distance,
                size: entry.size,
                symptom: entry.form.map((symptom) => `${symptom.key}-${symptom.value}`).join('、'),
            }
        })
    })

    const Tumor = [...responseTxt[0], ...responseTxt[1]]

    Tumor.map((Tumor) => {
        formattedReport += `TumorID: ${Tumor.TumorID}\n`
        formattedReport += `clock: ${Tumor.clock}\n`
        formattedReport += `distance: ${Tumor.distance}\n`
        formattedReport += `size: ${Tumor.size}\n`
        formattedReport += `symptom: ${Tumor.symptom}\n`
        formattedReport += '\n'
    })

    return formattedReport
}

module.exports = router
