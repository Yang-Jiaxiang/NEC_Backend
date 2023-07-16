const express = require('express')
const router = express.Router()
const SCHEDULE = require('../../models/schedule')
const xml = require('xml')
const fs = require('fs')
const path = require('path')

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

        const results = schedules.map((schedule) => {
            const createdAt = schedule.createdAt.toISOString().slice(0, 10).replace(/-/g, '')
            const filePath = `order_nhi_xml/${dateNow}/${schedule.patientID}_${createdAt}_${schedule.accessionNumber}.xml`
            var example3 = [
                {
                    patient: [
                        {
                            hdata: [
                                { h1: process.env.NHIORDERXML_ReportType },
                                { h2: schedule.nhiCard.INSTITUTION_CODE },
                                { h3: schedule.nhiCard.INSTITUTION_TYPE },
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
