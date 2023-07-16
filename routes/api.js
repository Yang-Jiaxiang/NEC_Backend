const express = require('express')
const router = express.Router()
const { verifyToken } = require('./auth')

router.use('/department', require('./apis/department'))
router.use('/exist', require('./apis/exist'))

router.use(verifyToken)
router.use('/patient', require('./apis/patient'))
router.use('/report', require('./apis/report'))
router.use('/user', require('./apis/user'))
router.use('/schedule', require('./apis/schedule'))
router.use('/blood', require('./apis/blood'))
router.use('/count', require('./apis/count'))
router.use('/stats', require('./apis/stats'))
router.use('/worklist', require('./apis/worklist'))
router.use('/dicom', require('./apis/dicom'))
router.use('/pacsSetting', require('./apis/pacsSetting'))

// 透過patientID, accessionNumber, createdAt, contentType取得報告
router.use('/queryReport', require('./apis/queryReport'))

// 透過patientID 取得病人健保卡資料
router.use('/nhiOrderXml', require('./apis/nhi_order_xml'))

module.exports = router
