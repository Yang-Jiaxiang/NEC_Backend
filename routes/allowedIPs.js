function restrictIPVerify(req, res, next) {
    const allowedIPs = process.env.ALLOWEDIPS.split(',')
    const clientIP = req.ip // 获取客户端 IP

    if (allowedIPs.includes(clientIP)) {
        // IP 在允许列表中，继续处理请求
        next()
    } else {
        // IP 不在允许列表中，返回错误响应
        res.status(403).json({ message: 'Access denied from this IP.' })
    }
}

module.exports = { restrictIPVerify }
