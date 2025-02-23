// LINE BotとGemini APIの設定
const LINE_CHANNEL_ACCESS_TOKEN = 'Ag86AAjTz2q4GSVGLORBPbQufudmyprCI3j5K6aOe9M+H2BeQYEsoQxBeNOSbyhniwFtoow5Kl8TFyt4Ja/8J+ebb6ahqBmVWb7AlQ8aU6GFORiXOuiIUfFBvRKERgWA7tnzabyaucaA9lkrHZ8a7wdB04t89/1O/w1cDnyilFU=';
const GEMINI_API_KEY = 'AIzaSyBWOujCNM9LpKmqPd-EZlPMGQLqyqwbqDs';
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`;

// ユーザーの状態を保存するためのプロパティストア
const userStates = PropertiesService.getScriptProperties();

function doPost(e) {
  if (!e || !e.postData || !e.postData.contents) {
    return ContentService.createTextOutput(JSON.stringify({
      'status': 'error',
      'message': 'Invalid request data'
    }));
  }

  try {
    const webhookData = JSON.parse(e.postData.contents);
    const event = webhookData.events[0];

    if (!event || event.type !== 'message' || event.message.type !== 'text') {
      return ContentService.createTextOutput(JSON.stringify({
        'status': 'error',
        'message': 'Invalid event type'
      }));
    }

    const userMessage = event.message.text;
    const userId = event.source.userId;
    const currentState = userStates.getProperty(userId) || 'initial';

    handleUserMessage(event, userMessage, userId, currentState);

    return ContentService.createTextOutput(JSON.stringify({
      'status': 'success'
    }));

  } catch (error) {
    console.error('Error in doPost:', error);
    return ContentService.createTextOutput(JSON.stringify({
      'status': 'error',
      'message': error.toString()
    }));
  }
}

function handleUserMessage(event, userMessage, userId, currentState) {
  if (userMessage === 'チェック開始') {
    userStates.setProperty(userId, 'waiting_location');
    replyToLine(event.replyToken, [
      {
        type: 'text',
        text: '彦星浮気チェックを開始します。'
      },
      {
        type: 'text',
        text: 'Q1.現在、あなたはどこにいますか？都道府県でお答えください'
      }
    ]);
    return;
  }

  if (currentState === 'waiting_location') {
      const location = analyzeLocation(userMessage);
      if (location === '該当なし') {
        replyToLine(event.replyToken, [{
          type: 'text',
          text: 'すみません、都道府県名で入力してください。'
        }]);
      } else if (location === '海外在住') {
        replyToLine(event.replyToken, [{
          type: 'text',
          text: '申し訳ありませんが、現在は日本国内の情報のみ対応しています。'
        }]);
      } else {
        // locationを保存
        userStates.setProperty(userId + '_a1', location);
        
        const weatherInfo = findUrlByPrefecture(location);
        
        // 天候情報を保存
        if (weatherInfo) {
          userStates.setProperty(userId + '_pressure', weatherInfo.pressure);
          userStates.setProperty(userId + '_temperature', weatherInfo.temperature);
          userStates.setProperty(userId + '_humidity', weatherInfo.humidity);
          userStates.setProperty(userId + '_weather', weatherInfo.weather);
        }
        
        let messages = [
          {
            type: 'text',
            text: `${location}にお住まいなんですね。`
          },
          {
            type: 'text',
            text: 'Q2.今夜のベガ（織姫星）とアルタイル（彦星）の距離感はどう見えますか？'
          }
        ];
        userStates.setProperty(userId, 'waiting_distance');
        replyToLine(event.replyToken, messages);
      }
      return;
  }

  if (currentState === 'waiting_distance') {
      // Q2の回答を保存
      userStates.setProperty(userId + '_a2', userMessage);
      
      // Q3に進む
      userStates.setProperty(userId, 'waiting_meteor');
      replyToLine(event.replyToken, [
        {
          type: 'text',
          text: 'なるほど、ありがとうございます。'
        },
        {
          type: 'text',
          text: 'Q3.最近、流れ星を見かけましたか？'
        }
      ]);
      return;
    }
    if (currentState === 'waiting_meteor') {
    // Q3の回答を保存
    userStates.setProperty(userId + '_a3', userMessage);
    
    // Q4に進む
    userStates.setProperty(userId, 'waiting_brightness');
    replyToLine(event.replyToken, [
      {
        type: 'text',
        text: 'なるほど、ありがとうございます。'
      },
      {
        type: 'text',
        text: 'Q4.今夜のアルタイル（彦星）の光度はどのように見えますか？'
      }
    ]);
    return;
  }

  if (currentState === 'waiting_brightness') {
    // Q4の回答を保存
    userStates.setProperty(userId + '_a4', userMessage);
    
    // Q5に進む
    userStates.setProperty(userId, 'waiting_wish');
    replyToLine(event.replyToken, [
      {
        type: 'text',
        text: 'なるほど、ありがとうございます。'
      },
      {
        type: 'text',
        text: 'Q5.短冊のお願い事は、当然織姫と彦星との関係良好を願いましたよね？'
      }
    ]);
    return;
  }

  function saveToSpreadsheet(userId, answers, result) {
    try {
      const ss = SpreadsheetApp.openById('10TzZB0IsuiwAqdfj7_MrX5l3w2Onomp2Lt--Cdtfwqw');
      const sheet = ss.getActiveSheet();
      
      // 結果から浮気度の数値のみを抽出（例：「浮気度：75%」から「75」を取得）
      const percentageMatch = result.match(/浮気度：(\d+)%/);
      const percentage = percentageMatch ? percentageMatch[1] : 'N/A';

      // 新しい行に追加するデータを準備
      const rowData = [
        userId,
        answers.a1 || '',
        answers.a2 || '',
        answers.a3 || '',
        answers.a4 || '',
        answers.a5 || '',
        percentage
      ];

      // 最終行の次の行に追加
      const lastRow = sheet.getLastRow();
      sheet.getRange(lastRow + 1, 1, 1, rowData.length).setValues([rowData]);

    } catch (error) {
      console.error('Error saving to spreadsheet:', error);
    }
  }

  if (currentState === 'waiting_wish') {
      // Q5の回答を保存
      userStates.setProperty(userId + '_a5', userMessage);
      
      // 診断結果を生成
      const analysisResult = analyzeCheatingRisk(userId);
      
      // スプレッドシートに保存するためのデータを収集
      const answers = {
        a1: userStates.getProperty(userId + '_a1'),
        a2: userStates.getProperty(userId + '_a2'),
        a3: userStates.getProperty(userId + '_a3'),
        a4: userStates.getProperty(userId + '_a4'),
        a5: userStates.getProperty(userId + '_a5')
      };
      
      // スプレッドシートに保存
      saveToSpreadsheet(userId, answers, analysisResult);
      
      replyToLine(event.replyToken, [
        {
          type: 'text',
          text: 'ありがとうございます。全ての質問が終わりました。'
        },
        {
          type: 'text',
          text: '診断結果をお伝えします！'
        },
        {
          type: 'text',
          text: analysisResult
        },
        {
          type: 'text',
          text: '再度診断を行いたい場合は、再度「チェック開始」と入力してください'
        }
      ]);

      // 状態をリセット
      userStates.setProperty(userId, 'initial');
      return;
  }

  // デフォルトの応答
  replyToLine(event.replyToken, [{
    type: 'text',
    text: '「チェック始め」と入力して浮気チェックを開始してください。'
  }]);
}

function analyzeLocation(message) {
  const prompt = `
    以下の文章から居住地を抽出してください。
    以下のルールに従って返答してください：

    1. 日本の都道府県が含まれている場合は、その都道府県名を返してください（例：東京都、大阪府）
    2. 海外の国や地域が含まれている場合は、「海外在住」と返してください
    3. 上記のいずれも含まれていない場合は「該当なし」と返してください
    
    入力文：${message}
  `;

  try {
    const response = callGeminiAPI(prompt);
    return response.trim();
  } catch (error) {
    console.error('Error in analyzeLocation:', error);
    return '該当なし';
  }
}


function getInfidelityRate() {
  const ss = SpreadsheetApp.openById('1rImjBB4JVHvogqw1D11KZzvlbcG24MnTsZm6y_FYQjE');
  const sheet = ss.getActiveSheet();
  return sheet.getRange('H50').getValue();
}

function analyzeCheatingRisk(userId) {
  // 保存された回答を取得
  const pressure = userStates.getProperty(userId + '_pressure');
  const temperature = userStates.getProperty(userId + '_temperature');
  const humidity = userStates.getProperty(userId + '_humidity');
  const weather = userStates.getProperty(userId + '_weather');
  const starDistance = userStates.getProperty(userId + '_a2');
  const meteor = userStates.getProperty(userId + '_a3');
  const brightness = userStates.getProperty(userId + '_a4');
  const wish = userStates.getProperty(userId + '_a5');
  
  // 流星群からの浮気率を取得
  const meteorInfidelityRate = getInfidelityRate();

  const prompt = `
    以下の情報と回答から、彦星の浮気度を分析してください。
    回答者は彦星や織姫ではなく、地球の一般人です。分析するのは彼の視点からの情報での浮気度です。
    
    気象情報：
    気圧：${pressure}hPa (例年の七夕平均は1013hPa)
    気温：${temperature}℃ (例年の七夕平均は25℃)
    湿度：${humidity}%
    天気：${weather}

    流星群による基本浮気率：${meteorInfidelityRate}%
    (この値は一年間の流星群の活動から算出された基準値です)

    気象情報の解釈基準：
    - 気圧が例年(1013hPa)より高い場合：彦星からの愛の圧力が弱まっており、浮気リスク増加
    - 気圧が例年より低い場合：彦星の愛の重圧が強く、誠実さを示す
    - 気温が例年(25℃)より高い場合：恋の炎が燃えており、織姫への想いが強い
    - 気温が例年より低い場合：心が冷めている可能性
    - 雨の場合：二人の愛の涙の象徴であり、深い愛情を示す
    - 晴れの場合：安定した関係
    - 曇りの場合：心に迷いがある可能性
    - 湿度が高い場合：感情が潤っており、愛情表現が豊か

    その他の回答内容：
    Q2. 今夜のベガ（織姫星）とアルタイル（彦星）の距離感はどう見えますか？: ${starDistance}
    Q3. 最近、流れ星を見かけましたか？: ${meteor}
    Q4. 今夜のアルタイル（彦星）の光度はどのように見えますか？: ${brightness}
    Q5. 短冊のお願い事は、当然織姫と彦星との関係良好を願いましたよね？: ${wish}

    以下の形式で回答してください：
    1. 浮気度を0%～100%で表示（流星群による基本浮気率を基準に、気象条件で増減を判断）
    2. その理由を気象条件と流星群の影響を中心に3点程度で説明
    3. 理由からの結論を提示

    注意点：
    - 流星群による基本浮気率を基準値として使用。ここから、他の情報でどれだけ変動するか。最終的な浮気率を表示。
    - 気象条件による補正を行う
    - 星の距離、光度は補足的な判断材料
    - 短冊の願い事は補足的な判断材料
    - 理由に書く部分はQ2~Q5の内容を主に書いてください
    
    回答は以下のフォーマットで：
    浮気度：XX%
    
    【分析理由】
    ・理由1
    ・理由2
    ・理由3

    【結論】
  `;

  try {
    const response = callGeminiAPI(prompt);
    return response.trim();
  } catch (error) {
    console.error('Error in analyzeCheatingRisk:', error);
    return `
      申し訳ありません。分析中にエラーが発生しました。
      浮気度：判定不可
      
      【分析理由】
      ・システムエラーにより詳細な分析ができませんでした
      
      【アドバイス】
      ・しばらく時間をおいて、再度診断を行ってください
    `;
  }
}


function findUrlByPrefecture(prefecture) {
  const ss = SpreadsheetApp.openById('1rImjBB4JVHvogqw1D11KZzvlbcG24MnTsZm6y_FYQjE');
  const sheet = ss.getActiveSheet();
  const data = sheet.getDataRange().getValues();
  
  // デバッグ用にログを出力
  console.log("検索する都道府県:", prefecture);
  
  // 完全一致で検索
  for (let i = 1; i < data.length; i++) {
    console.log("スプレッドシートの都道府県:", data[i][0]); // デバッグ用
    
    if (data[i][0] === prefecture) {
      return {
        pressure: data[i][3],
        temperature: data[i][4], 
        humidity: data[i][5],
        weather: data[i][6]
      };
    }
  }
  return null;
}



function replyToLine(replyToken, messages) {
  try {
    const url = 'https://api.line.me/v2/bot/message/reply';
    
    const payload = {
      replyToken: replyToken,
      messages: messages
    };

    const options = {
      method: 'post',
      contentType: 'application/json',
      headers: {
        'Authorization': 'Bearer ' + LINE_CHANNEL_ACCESS_TOKEN
      },
      payload: JSON.stringify(payload)
    };

    UrlFetchApp.fetch(url, options);
  } catch (error) {
    console.error('Error in replyToLine:', error);
  }
}

function callGeminiAPI(message) {
  try {
    const payload = {
      contents: [{
        parts: [{
          text: message
        }]
      }]
    };

    const options = {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload)
    };

    const response = UrlFetchApp.fetch(GEMINI_API_URL, options);
    const jsonResponse = JSON.parse(response.getContentText());
    
    return jsonResponse.candidates[0].content.parts[0].text;
  } catch (error) {
    console.error('Error in callGeminiAPI:', error);
    return "申し訳ありません。エラーが発生しました。";
  }
}

// 多田
function doGet() {
  // テンプレートを作成
  const template = HtmlService.createTemplateFromFile('Index');
  
  // スプレッドシートから値を取得
  // テンプレートに変数を設定
    template.uwakiritu = getResultAverage('H1'); // uwakiritu変数を定義
    const roundedValue = Math.round(template.uwakiritu / 10) * 10;
    const rowNumber = roundedValue / 10; // 10で割って行番号を取得
    const rowNum = rowNumber + 1

    template.iiwake = getResultAverage('K'+ rowNum); // iiwake変数を定義
  
  
  // テンプレートを評価して返す
  return template.evaluate()
    .setTitle('彦星浮気チェッカー')
    .setFaviconUrl('https://chicodeza.com/wordpress/wp-content/uploads/amanogawa-illust1.png')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

// 多田
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

// 多田 浮気度の平均を取得
function getResultAverage(area) {
  const spreadsheetId = '10TzZB0IsuiwAqdfj7_MrX5l3w2Onomp2Lt--Cdtfwqw';
  const sheet = SpreadsheetApp.openById(spreadsheetId).getActiveSheet();
  
  // セルの値を取得
  const value = sheet.getRange(area).getValue();
  
  return value;
}