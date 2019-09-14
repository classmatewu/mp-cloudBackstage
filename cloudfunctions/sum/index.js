// 云函数入口文件
// const cloud = require('wx-server-sdk') // 引入wx-server-sdk包

// cloud.init()

// 云函数入口函数
exports.main = async (event, context) => {
    // 编写sum云函数
    return {
        sum: event.a + event.b
    }
}
