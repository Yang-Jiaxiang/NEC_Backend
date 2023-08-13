const express = require('express')
const router = express.Router()
const SCHEDULE = require('../../models/schedule')
const axios = require('axios')

router.route('/').get(async (req, res) => {
    try {
        const { rangeTime, called } = req.query

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
            {
                $lookup: {
                    from: 'reports',
                    let: { pid: '$reportID' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $eq: ['$_id', { $toObjectId: '$$pid' }],
                                },
                            },
                        },
                    ],
                    as: 'report',
                },
            },
        ])

        const post_nhi_order_xml = await axios.post(process.env.ORDER_XML_API, { schedules })

        return res.status(200).json(await post_nhi_order_xml)
    } catch (e) {
        return res.status(500).json({ message: e.message })
    }
})

module.exports = router
