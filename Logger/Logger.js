const morgan = require('morgan')
const fs = require('fs')
const path = require('path')
const loggerSchema = require('../models/logger')

const logBuffer = [] // 日誌緩衝區

const accessLogStream = () => {
    const logsToWrite = [...logBuffer] // 複製緩衝區中的日誌
    logBuffer.length = 0 // 清空緩衝區

    logsToWrite.forEach((logData) => {
        const logger = new loggerSchema(logData)

        logger.save((err) => {
            if (err) {
                console.error('無法寫入日誌到 MongoDB:', err)
            }
        })
    })
}

// 每 30 秒寫入一次日誌（可根據需要調整間隔時間）
setInterval(accessLogStream, 30000)

const Logger = (req, res, next) => {
    const logData = {
        remoteAddr: req.ip,
        method: req.method,
        url: req.url,
        status: res.statusCode,
        contentLength: res.get('Content-Length'),
        responseTime: res.get('X-Response-Time'),
        date: new Date(),
        requestData: req.body,
    }

    logBuffer.push(logData) // 將日誌資料加入緩衝區

    next()
}

module.exports = { Logger }
