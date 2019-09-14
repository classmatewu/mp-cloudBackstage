// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init()

const db = cloud.database(); // 获取到云数据库

// 云函数入口函数
exports.main = async (event, context) => {
    // 通过键名：键值，而不是_id，所以可以指定所有相同键名的元素批量删除数据
    // 由于是异步函数，所以直接返回结果不会收到数据，在加上async和await可以将异步变成同步，就可以直接return了
    try {
        return await db.collection("user").where({
            name: "jerry"
        })
        .remove();
    } catch (err) {
        console.log(err);
    }

}