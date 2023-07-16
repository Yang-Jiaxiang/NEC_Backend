const express = require('express')
const router = express.Router()
const fs = require('fs')
const path = require('path')
const axios = require('axios')
const url = require('url')
const DICOM = require('../../models/dicom')

router.route('/').get(async (req, res) => {
    try {
        const results = ['aaa']
        return res.status(200).json({ results, count: results.length })
    } catch (e) {
        return res.status(500).json({ message: e.message })
    }
})

module.exports = router
