// miniprogram/pages/test/test.js
const db = wx.cloud.database(); // 初始化数据库

Page({
    data: {
        imgsData: [],
    },


    // 一、云数据库


    // 点击按钮触发插入函数
    insert(event) {
        // 添加数据到数据库

        // 表示获取到数据库中对应表名为user的表，调用add()函数向该表中添加数据
        // 1）回调函数写法
        // db.collection("user").add({
        //     data: {
        //         name: "jerry",
        //         age: 20
        //     },
        //     // 两个回调函数，成功/失败进入
        //     success: res => {
        //         console.log(res);
        //     },
        //     fail: err => {
        //         console.log(err);
        //     }
        // });

        // 2）promise写法，成功进入then，失败进入catch
        db.collection("user").add({
            data: {
                name: "jack",
                age: 18
            },
        }).then(res => {
            console.log(res);
        }).catch(err => {
            console.log(err);
        });
    },

    // 更新云数据库指定数据事件
    update(event) {
        // 由于数据库数据的唯一标识是_id，类似关系型数据库的主键，
        // 所以我们通过_id来获取指定数据，然后对其进行更新
        // 在文档型数据库中，doc表示一条数据
        db.collection("user").doc("26b301645d46fa140bb5d0935ffc7d64").update({
            data: {
                age: 21, // 将age更新为21
            }
        }).then(res => {
            console.log(res);
        }).catch(err => {
            console.log(err);
        });

    },


    // 查找数据
    search() {
        // 数据库.表名.where({ 键名: 键值 }).get()
        db.collection("user").where({
            name: "jerry",
        }).get().then(res => {
            console.log(res);
        }).catch(err => {
            console.log(err);
        });
    },
    // 注意，可以对数据库数据进行设置权限，根据权限不同，在这里查询到的数据也会可能会不同



    // 删除指定数据
    delete(event) {
        // 数据库.某个表.某条数据(通过唯一标识即_id找到).remove
        db.collection("user")
            .doc("26b301645d46fa140bb5d0935ffc7d64")
            .remove()
            .then(res => {
                console.log(res);
            }).catch(err => {
                console.log(err);
            });
    },
    // 注意，这种方式智能删除一条数据，要批量删除数据，只能在云函数中实现


    //二、云函数 


    // 该点击事件调用云函数sum
    useSum(event) {
        wx.cloud.callFunction({
                // 云函数名称
                name: "sum",
                // 传给云函数的参数
                data: {
                    a: 1,
                    b: 2,
                },
            })
            .then(res => {
                console.log(res.result) // 3
            })
            .catch(console.error)
    },


    //　点击事件触发getInfo函数，调用login云函数获取用户的信息
    getInfo(event) {
        wx.cloud.callFunction({
                // 云函数名称
                name: "login",
            })
            .then(res => {
                console.log(res)
            })
            .catch(console.error)
    },


    // 调用batchDelete云函数批量删除数据
    doBatchDelete(event) {
        wx.cloud.callFunction({
                // 云函数名称
                name: "batchDelete",
            })
            .then(res => {
                console.log(res)
            })
            .catch(console.error)
    },



    // 三、云存储


    // 点击按钮后上传图片
    // 首先调用上传图片api，然后调用云存储的API函数将图片储存到云存储中，再将返回的fileID存到数据库中
    update(event) {
        wx.chooseImage({
            count: 1,
            sizeType: ['original', 'compressed'],
            sourceType: ['album', 'camera'],
            success(res) {
                // tempFilePath可以作为img标签的src属性显示图片
                // tempFilePath为图片在小程序的临时图片路径，是一个数组，当前只有一个元素
                const tempFilePaths = res.tempFilePaths;
                console.log(tempFilePaths);


                // 2、上传成功则将图片传到云存储
                wx.cloud.uploadFile({
                    // 指定上传到的云路径，不能写死，否则只能上传一张图片，下次会覆盖前一次的文件
                    // 这里我们用从1970.01.01到现在的毫秒总数为cloudPath，以使得文件不会覆盖掉
                    cloudPath: `${new Date().getTime()}.png`,
                    // 指定要上传的文件的小程序临时文件路径
                    filePath: res.tempFilePaths[0],
                    // 成功回调
                    success: res => {
                        console.log('上传成功', res);
                        console.log("fileID: ", res.fileID); // fileID为云存储文件的唯一标识，类似云数据库的_id


                        // 3、成功上传到图片云存储后，将返回的fileID存到云数据库里
                        db.collection('images').add({
                            // data 字段表示需新增的 JSON 数据
                            data: {
                                fileID: res.fileID,
                            },
                            success: function(res) {
                                // res 是一个对象，其中有 _id 字段标记刚创建的记录的 id
                                console.log(res)
                            }
                        })
                    },
                });
            }
        })
    },


    // 点击按钮展示我上传过的所有图片
    // 步骤思路：
    // 由于是我自己要获取自己的图片，不能获取到别人的图片，所以首先要获取每个人在该小程序的唯一标识：openid
    // 其次，根据该openid去数据库找到对应的数据库数据，调用数据查找api，返回值是一个数组，即符合条件的json的集合
    // 最后，再从拿到的数组中的每个数据json中拿到fileID，fileID就可以成为image的src属性值
    showMyImgs(event) {
        // 1、获取openid
        wx.cloud.callFunction({
            // 需调用的云函数名
            name: 'login',
            // 成功回调
            success: res => {
                console.log(res.result.openid);

                // 2、拿到openid后就去数据库找符合的数据
                db.collection('images').where({
                     _openid: res.result.openid
                })
                .get({
                    success: res => {
                        console.log(res.data); // res.data就取到了数据json的数组

                        // 将数据保存到data对象的imgsData数组中
                        this.setData({
                            imgsData: res.data,
                        })

                    }
                })
            }
        });
    },


    // 点击下载按钮，下载对应的文件
    // 思路
    // 1、将表示该文件的fileID利用自定义属性方式，从视图层传到数据层
    // 2、拿到该文件在云存储的fileID，调用API函数去云存储里找该文件，返回结果是templateFilePath
    // 3、利用templateFilePath，调用下载图片API函数，将图片下载到本地；并设置保存成功的模态框
    downLoad(event) {
        const fileID = event.target.dataset.fileid;
        // 2、调用API函数去云存储里找该文件，返回结果是templateFilePath
        wx.cloud.downloadFile({
            fileID: fileID, // 文件 ID
            success: res => {
                // 返回临时文件路径
                console.log(res.tempFilePath);

                // 3、利用templateFilePath，调用下载图片API函数，将图片下载到本地，（法一）
                wx.saveImageToPhotosAlbum({
                    filePath: res.tempFilePath,
                    success(res) { 
                        console.log(res);
                        // 保存成功的提示框
                        wx.showToast({
                            title: '保存成功',
                            icon: 'success',
                            duration: 1000
                        })
                    }
                })

                // 3、法二，有点小错误，进入success了，但文件没有弹出下载到本地的选项，可能是某个属性没设置
                // wx.downloadFile({
                //     url: res.tempFilePath, //仅为示例，并非真实的资源
                //     success(res) {
                //     // 只要服务器有响应数据，就会把响应内容写入文件并进入 success 回调，
                //     // 业务需要自行判断是否下载到了想要的内容
                //         console.log("djsl");
                //         console.log(res);
                //         wx.showToast({
                //             title: '保存成功',
                //             icon: 'success',
                //             duration: 1000
                //         })
                //     },
                //     fail: err => {
                //         console.log("shibail")
                //         console.log(err);
                //     }
                // })

            },
        })
    },


    http(event) {
        wx.request({
            url: "https://openapi.yiban.cn/oauth/access_token",
            method: "POST",
            data: {
                client_id: "f8ca1260f7192776",
                "client_secret": "ebb1adddf6f849c8e7b90f263d9459e0",
                code: "1622ae11df8011dd9db28c4979df8c74133a1f73",
                redirect_uri: "https://www.jarrychung.com"
            },
            header: {
                'content-type': 'application/json'
            },
            success: res => {
                console.log(res);
            },
            fail: err => {
                console.log(err);
            }
        })
    }


})







// 云开发
// 0、小程序云开发
// 阿里巴巴图标库
// vant - weapp 小程序组件，按钮，评论组件等

// 1、微信小程序云开发提供了开发者一个服务器平台，开发者无需购买云服务器以及进行域名备案，就可以享受腾讯云服务
// 小程序云开发提供了云函数、云数据库、云存储3大功能

// 2、云数据库：增删查改
// 流程：
// 1）在云服务器控制台数据库先新建一个表，例如：user
// 2）初始化数据库：const db = wx.cloud.database(); // 初始化数据库


// 3、设置小程序每次刷新时启动页面项是指定页面有两种方法：
// 1）在app.json的page对象中，将启动页面路径放到第一条
// 2）点击ide界面上面的编译按钮左边的输入框，选择“添加编译模式”，指定启动页面路径

// 4、云函数即运行在云端的服务器代码，主要是写后台的业务逻辑，语言目前只支持nodejs

// 5、云函数的编写以及调用：
// 1）鼠标移到云函数根文件夹，右键选择创建云函数，（可能会有要求要下载依赖的包，点击确认即可），
// 创建成功后打开云开发后台，刷新即可看到创建的云函数
// 2）创建的云函数文件下有云函数的入口js文件，以及配置文件，在js文件中写入云函数的逻辑代码
// eg:

// 3）一旦云函数代码发生改变，就得鼠标右键该云函数，选择部署云函数，（一般选择不上传module）

// 4）在前端代码中调用云函数：
// wx.cloud.callFunction({
//     // 云函数名称
//     name: 'add',
//     // 传给云函数的参数
//     data: {
//         a: 1,
//         b: 2,
//     },
// })
//     .then(res => {
//         console.log(res.result) // 3
//     })
//     .catch(console.error)

// 注意，云函数编写成功后也可以在云开发平台进行代码测试
// {
//     "key1": "test value 1",
//         "key2": "test value 2"
// }


// 6、可以理解为小程序端即为前端，云函数端即为服务器端
// 单条数据库数据的删除可以在小程序端也可以在云函数端中操作，但批量删除则只能在云函数端操作
// 在小程序端中是通过唯一标识_id来找到指定数据，然后删除，所以只能删除一条，不能批量
// 在云函数端中是通过 键名：键值 来找到指定数据，然后删除，所以能批量删除所有键名相同的元素（当然还得考虑数据权限问题）

// 7、云存储
// 将文件上传到云存储中后，会返回一个fileID，即该文件的唯一标识，将其存到云数据库中，
// 方便下次从云数据库中拿到该fileID，就可以从云存储拿到该文件

// 8、
// 8.1、fileID是文件在云存储的唯一标识，fileID可用于：
// 1）image标签的src属性值，作为本地图片路径
// 2）由于是文件在云存储的唯一标识，所以也用于用fileID去云存储中找文件
// 8.2、templateFilePath是文件的小程序临时文件路径，一般用于从云存储存取文件时：
// 1）用户调用上传图片的api，图片上传成功会返回templateFilePath；用该templateFilePath进而将文件存储到云存储中
// 2）用户根据自己个人标识的openid，从数据库里取到文件的唯一标识fileID；
// 用fileID从云存储取到对应的文件，成功时会返回图片的templateFilePath；
// 用templateFilePath调用下载图片到本地的接口就可以将图片下载到本地