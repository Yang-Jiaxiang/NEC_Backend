const express = require('express')
const router = express.Router()
const axios = require('axios')
const dicomTag = require('../../assets/DICOM-Tags.json')

router.route('/').get(async (req, res) => {
    /* 	
            #swagger.tags = ['Dicom']
            #swagger.description = '取得DICOM JSON Data' 
        */
    try {
        let { search, limit, offset, sort, desc } = req.query
        offset = offset * limit

        const { data } = await axios.get(process.env.PACS_URL, { params: { limit, offset, PatientID: search } })
        const { data: count } = await axios.get(process.env.PACS_URL)

        const result = data.map(d => {
            const patient = dicomTag.patient.reduce((accumulator, currentValue) => {
                return { ...accumulator, [currentValue.keyword]: (d[currentValue.tag]['Value'] && d[currentValue.tag]['Value'][0]) || null }
            }, {})
            const study = dicomTag.study.reduce((accumulator, currentValue) => {
                return { ...accumulator, [currentValue.keyword]: (d[currentValue.tag]['Value'] && d[currentValue.tag]['Value'][0]) || null }
            }, {})
            return { ...patient, ...study }
        })

        const asyncRes = await Promise.all(
            result.map(async i => {
                const { data } = await axios.get(process.env.PACS_URL + `/${i.StudyInstanceUID}/instances`)
                const instances = data[0]

                const SeriesInstanceUID = instances['0020000E']['Value'][0]
                const SOPInstanceUID = instances['00080018']['Value'][0]
                return {
                    ...i,
                    imageURL: `${process.env.DICOM_JPEG_URL}?requestType=WADO&studyUID=${i.StudyInstanceUID}&seriesUID=${SeriesInstanceUID}&objectUID=${SOPInstanceUID}&contentType=image/jpeg`,
                }
            })
        )

        return res.status(200).json({ results: asyncRes, count: count.length })
    } catch (e) {
        return res.status(500).json({ message: e.message })
    }
})

router.route('/:id').get(async (req, res) => {
    /* 	
            #swagger.tags = ['Dicom']
            #swagger.description = '取得單一DICOM' 
        */
    try {
        const { id } = req.params

        if (!id) return res.status(404).json({ message: '找不到DICOM' })
        return res.status(200).json(id)
    } catch (e) {
        return res.status(500).json({ message: e.message })
    }
})

module.exports = router
