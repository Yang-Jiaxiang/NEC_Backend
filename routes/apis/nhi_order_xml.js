const express = require('express')
const router = express.Router()
const SCHEDULE = require('../../models/schedule')
const xml = require('xml')
const fs = require('fs')
const path = require('path')
const axios = require('axios')

const getReportText = async ({ patientID, accessionNumber, accessToken }) => {
    const url = `http://localhost:${process.env.PORT}/nec/api/queryReport?patientID=${patientID}&accessionNumber=${accessionNumber}&contentType=text`

    try {
        const result = await axios.get(url, {
            headers: {
                Cookie: `accessToken=${accessToken}`,
            },
        })

        return result.data
    } catch (error) {
        console.error('Error:', error.message)
        throw error
    }
}

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

        if (schedules.length === 0) {
            return res.status(400).json({ error: 'No data' })
        }

        const dateNow = new Date().toISOString().slice(0, 10).replace(/-/g, '')

        const results = schedules.map(async (schedule) => {
            const createdAt = schedule.createdAt.toISOString().slice(0, 10).replace(/-/g, '')
            const filePath = `order_nhi_xml/${dateNow}/${schedule.patientID}_${createdAt}_${schedule.accessionNumber}.xml`
            const reportText = await getReportText({
                patientID: schedule.patientID,
                accessionNumber: schedule.accessionNumber,
                accessToken: req.cookies.accessToken,
            })
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

            // 获取目录路径
            const directoryPath = path.dirname(filePath)

            // 检查目录路径是否存在，如果不存在则创建
            if (!fs.existsSync(directoryPath)) {
                fs.mkdirSync(directoryPath, { recursive: true })
            }

            fs.writeFile(filePath, xmlData, (err) => {
                if (err) {
                    console.error('Error writing XML file:', err)
                } else {
                    console.log('XML file has been written successfully.')
                }
            })
        })

        return res.set('Content-Type', 'text/xml').status(200).send(results)
    } catch (e) {
        return res.status(500).json({ message: e.message })
    }
})

module.exports = router
