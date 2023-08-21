/*
 * 自动加入TestFlight
 *
 * QLAutoJoinTestFlight.js
 * 环境变量：TF_APP_ID，TF_KEY，session_id，session_digest，request_id
 * 参考脚本：
 * https://github.com/DecoAri/JavaScript/blob/main/Surge/Auto_join_TF.js
 * https://github.com/chouchoui/QuanX/blob/master/Scripts/testflight/Auto_join_TF.js
 */

const $ = new Env('自动加入TestFlight');
const notify = $.isNode() ? require('./sendNotify') : '';
// 通知封装字符串
let notifyStr = addLog("[自动加入TestFlight]\n");

// 读取环境变量
let tf_app_ids = process.env.TF_APP_ID;
let tf_key = process.env.TF_KEY;
let tf_session_id = process.env.session_id;
let tf_session_digest = process.env.session_digest;
let tf_request_id = process.env.request_id;

// 调用异步方法处理集合中的元素
processCollection().then(r => console.log('自动加入TestFlight结束...'));

async function processCollection() {
  let ids = [];
  if (tf_app_ids) {
    if (tf_app_ids.indexOf(',') > -1) {
      ids = tf_app_ids.split(',');
    } else if (tf_app_ids.indexOf('\n') > -1) {
      ids = tf_app_ids.split('\n');
    } else {
      ids = [tf_app_ids];
    }
    addLog(`需要加入的TF_APP_ID = ${ids}`);
    try {
      for (const tf_id of ids) {
        await autoPost(tf_id.trim());
        addLog("\n");
      }
    } catch (error) {
      addLog("加入TF发生错误，请检查session是否过期或APPID是否存在，以下是异常信息：" + error);
    }
  } else {
    addLog('未发现需要加入的TF_APP_ID，请填写TF_APP_ID!');
  }

  // 发送通知
  notify.sendNotify('自动加入TestFlight', notifyStr);
  return '自动加入TestFlight' + '\n\n' + notifyStr;
}

async function autoPost(tf_id) {
  addLog(tf_id + " 开始执行...");
  let url = "https://testflight.apple.com/v3/accounts/" + tf_key + "/ru/" + tf_id;
  let headers = {
    "X-Session-Id": tf_session_id,
    "X-Session-Digest": tf_session_digest,
    "X-Request-Id": tf_request_id,
  };

  addLog(tf_id + " 参数拼装完成...");
  // console.log(tf_id + " 请求URL = " + url);
  // console.log(tf_id + " 请求头 = " + JSON.stringify(headers));

  // 发送请求并获取响应的body
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: headers
    });

    addLog(tf_id + " 开始发送请求...");
    const body = await response.text();
    addLog(tf_id + " 收到响应内容...");

    if (body.status === 404) {
      addLog(tf_id + " 不存在该TF，请在环境变量TF_APP_ID中删除该APPID");
    } else {
      let jsonData = JSON.parse(body);
      if (jsonData.data == null) { // "This beta isn't accepting any new testers right now."
        addLog(`${tf_id} 此测试版目前不接受任何新测试者。${jsonData.messages[0].message}`);
      } else if (jsonData.data.status === "FULL") { // This beta is full.
        const appName = jsonData.data.app.name;
        addLog(`${tf_id} ${appName} 此测试版已满。${jsonData.data.message}`);
      } else {
        const response1 = await fetch(url + "/accept", {
          method: "POST",
          headers: headers
        });
        const body1 = await response1.text();
        // console.log(`${tf_id} 的响应body1：${body1}`);
        let jsonBody = JSON.parse(body1);
        addLog(`${tf_id} ${jsonBody.data.name} TestFlight加入成功，请删除该APPID`);
      }
    }
  } catch (error) {
    addLog(`${tf_id} 加入TF时出错：${error.message}`);
  }
}

function addLog(info) {
  console.log(info);
  notifyStr = notifyStr + info + '\n';
  return notifyStr;
}