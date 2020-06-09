
function scrapingJyuyou() {
  // ■Scraping処理
  const url = 'https://www.city.shinagawa.tokyo.jp/';
  let fromText = '<ul class="infolist">'; // 取得するタグの開始指定
  let toText = '</ul>'; // 取得するタグの終了指定
  
  // スクレイピング
  const content = UrlFetchApp.fetch(url).getContentText();

  // パース
  let data = Parser.data(content).from(fromText).to(toText).iterate();

  // 登録日取得
  let regexUpdate = new RegExp('<span class="date">(.*?)</span>', 'g');
  let matchedUpdate = data.toString().match(regexUpdate);
  let replaceWordFromDate = /<span class="date">/g; // 取得後のタグで不要な部分を指定。後続のreplaceで利用する。
  let replaceWordToDate = /<\/span>/g; // 取得後のタグで不要な部分を指定。後続のreplaceで利用する。

  // タイトル取得
  var regexTitle = new RegExp('<a href=(.*?)>(.*?)</a>', 'g');
  var matchedTitle = data.toString().match(regexTitle);
  let replaceWordFromTitle = /<a href=(.*?)>/g;
  let replaceWordToTitle = /<\/a>/g;

  // URL取得
  var regexUrl = new RegExp('<a href=(.*?)>(.*?)</a>', 'g');
  var matchedUrl = data.toString().match(regexUrl);
  let replaceWordFromUrl = /<a href="/g;
  let replaceWordToUrl = /">(.*?)<\/a>/g;
  
  // 結果格納
  let items = [];

  // 不要なタグを除去して、結果(items)に追加
  for (let i in matchedUpdate) {
    items.push([
      matchedUpdate[i].replace(replaceWordFromDate, '').replace(replaceWordToDate, ''),
      matchedTitle[i].replace(replaceWordFromTitle, '').replace(replaceWordToTitle, ''),
      matchedUrl[i].replace(replaceWordFromUrl, '').replace(replaceWordToUrl, '')
    ]);
  }
  
  // ■Spreadsheet
  const sheet = SpreadsheetApp.getActive().getSheetByName('重要な情報');

  // Spreadsheetに登録
  sheet.getRange(2, 1, items.length, items[0].length).setValues(items);  
  
  
  // sendmail
  sendMail('重要な情報');

}


function scrapingOshirase() {

  // ■Scraping処理
  const url = 'https://www.city.shinagawa.tokyo.jp/PC/re_direct/hpg000016838.html';
  let fromText = '<ul class="link">'; // 取得するタグの開始指定
  let toText = '</ul>'; // 取得するタグの終了指定
  const content = UrlFetchApp.fetch(url).getContentText();
  
  let data = Parser.data(content).from(fromText).to(toText).iterate();
  // toString()
  // https://chaika.hatenablog.com/entry/2019/11/15/083000
  
  // 登録日取得
  let regexUpdate = new RegExp('<p class="news-list-date">(.*?)</p>', 'g');
  let matchedUpdate = data.toString().match(regexUpdate);
  let replaceWordFromDate = /<p class="news-list-date">/g; // 取得後のタグで不要な部分を指定。後続のreplaceで利用する。
  let replaceWordToDate = /<\/p>/g; // 取得後のタグで不要な部分を指定。後続のreplaceで利用する。

  // タイトル取得
  let regexTitle = new RegExp('<a href=(.*?)>(.*?)</a>', 'g');
  let matchedTitle = data.toString().match(regexTitle);
  let replaceWordFromTitle = /<a href=(.*?)>/g; // 取得後のタグで不要な部分を指定。後続のreplaceで利用する。
  let replaceWordToTitle = /<\/a>/g; // 取得後のタグで不要な部分を指定。後続のreplaceで利用する。

  // URL取得
  let regexUrl = new RegExp('<a href=(.*?)>(.*?)</a>', 'g');
  let matchedUrl = data.toString().match(regexUrl);
  let replaceWordFromUrl = /<a href="/g; // 取得後のタグで不要な部分を指定。後続のreplaceで利用する。
  let replaceWordToUrl = /">(.*?)<\/a>/g; // 取得後のタグで不要な部分を指定。後続のreplaceで利用する。

  // 結果格納
  let items = [];

  // 不要なタグを除去して、結果(items)に追加
  for (let i in matchedUpdate) {
    items.push([
      matchedUpdate[i].replace(replaceWordFromDate, '').replace(replaceWordToDate, ''),
      matchedTitle[i].replace(replaceWordFromTitle, '').replace(replaceWordToTitle, ''),
      matchedUrl[i].replace(replaceWordFromUrl, '').replace(replaceWordToUrl, '')
    ]);
  }
  
  // ■Spreadsheet
  const sheet = SpreadsheetApp.getActive().getSheetByName('区からのお知らせ');

  // Spreadsheetに登録
  // 2行目１列から取得
  sheet.getRange(2, 1, items.length, items[0].length).setValues(items);  

  sendMail('区からのお知らせ');
}


function sendMail(SheetByName) {
  // データ取得するシートを指定
  var sheet = SpreadsheetApp.getActive().getSheetByName(SheetByName);
  // シート内のデータ取得
  var rangeValues = sheet.getDataRange().getValues();
  let recipient = 'ここにメールアドレスを記入する';
  let subject = '品川区 - ' + SheetByName; // メール件名。まあ適当に。
  let body = '';
  
  let date = new Date();
  let today = Utilities.formatDate(date, 'JST', 'yyyy-MM-dd');
  //現在の「日」を取得
  let day = date.getDate();
  //前日日付にしたい時は-1する
  date.setDate(day-2);
  //日付の表示形式を整形する
  let oneWeekBefore = Utilities.formatDate(date, 'JST', 'yyyy-MM-dd');
  let newFlg = false;
  
  for(let i=1; i<rangeValues.length; i++) {
    if (Utilities.formatDate(new Date(rangeValues[i][0]), 'Asia/Tokyo', 'yyyy-MM-dd') >= oneWeekBefore) {
      body += Utilities.formatDate(new Date(rangeValues[i][0]), 'Asia/Tokyo', 'yyyy-MM-dd');
      body += '\t'
      body += rangeValues[i][1]
      body += '\n'
      body += rangeValues[i][2]
      body += '\n\n'
    };
  };
  
  // 該当するレコードが無い場合は情報が無い旨をメール本文に記載
  if (body == '') {
    body = '新着情報はありません。';
  }

  GmailApp.sendEmail(recipient, subject, body); //, options
}