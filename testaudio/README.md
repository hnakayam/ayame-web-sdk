# testaudio

オーディオのみの通話を試すためのテスト用コードです。以下の順番で実行してください。

1. このプロジェクトは node.js を利用してTypeScriptのビルド等を行います。以下を参照して `node.js` および `npm` をインストールしてください。

https://nodejs.org/ja/download/

Windowsの場合は環境変数 `NODE_PATH`に `%APPDATA%\npm\node_modules` を設定してください。

2. npm同様のモジュール管理ツール `yarn` をインストールします。

https://yarnpkg.com/getting-started/install

3. ベースディレクトリで `yarn install` を実行し、依存モジュールをインストールしてください。

2. ベースディレクトリで何らかのスタティックWebサーバーを起動してください。

例えば node-static を利用する場合は、以下のようにインストールした後、

`npm install -g node-static`

ベースディレクトリで以下のように実行します。

`static -c 0 .`

3. WebRTC対応のブラウザで以下のいずれかのURLを開きます。

http://localhost:8080/testaudio/sendonly.html

http://localhost:8080/testaudio/recvonly.html

http://localhost:8080/testaudio/sendrecv.html


同じAyameシグナリングサーバーに接続する同じroom IDの2つのブラウザ間でWebRTC通話が可能です。

sendonly → recvonly
sendrecv ⇔ sendrecv

の2通りのシナリオで動作確認しています。


## 動作説明

### sendonly.html

ページを開くとマイクの使用がリクエストされ、その後音声入力が始まります。
このときオーディオコントロールのミュート解除を行うと、マイク音声のモニタが可能です (ハウリング音が発生する場合はヘッドセット等を利用してください)

その後「接続」ボタンを押すとayameシグナリングサーバーに接続します。すでに接続相手がいるか、あるいは新しく接続相手が接続するとWebRTC通話(ただし送信のみ一方向)が始まります。
「切断」ボタンを押すか、相手が切断した場合にはWebRTC通話が終了します。再度WebRTC通話を行うには(両側で)再度「接続」ボタンを押してください。

### recvonly.html

このテストではマイクは使用しません。

オーディオコントロールでリモート側音声のボリュームやミュートなどのコントロールを行います。

「接続」ボタンを押すとayameシグナリングサーバーに接続します。すでに接続相手がいるか、あるいは新しく接続相手が接続するとWebRTC通話(ただし受信のみ一方向)が始まります。
「切断」ボタンを押すか、相手が切断した場合にはWebRTC通話が終了します。再度WebRTC通話を行うには(両側で)再度「接続」ボタンを押してください。

### sendrecv.html

双方向の通話テストを行います。

![sendrecv.html](testaudio_sendrecv.png)

左側のオーディオコントロールでローカル側音声のコントロールを行います。右側のオーディオコントロールでリモート側音声のボリュームやミュートなどのコントロールを行います。

「接続」ボタンを押すとayameシグナリングサーバーに接続します。すでに接続相手がいるか、あるいは新しく接続相手が接続するとWebRTCの双方向通話が始まります。
「切断」ボタンを押すか、相手が切断した場合にはWebRTC通話が終了します。再度WebRTC通話を行うには(両側で)再度「接続」ボタンを押してください。

左側のオーディオコントロールはミュート解除すると(接続中かどうかに関係なく)ローカル音声のモニタが可能です。モニタ中にWebRTC接続すると、モニタ音声とリモート音声はミックスして出力されます。

## Ayame シグナリングサーバー、Room IDの変更

main.jsの以下の記述を変更してください。

```
const signalingUrl = 'wss://ayame-labo.shiguredo.jp/signaling';
let roomId = 'ayame-test-sdk';
```

## オーディオコーデックの変更

sendonly.html と sendrecv.htmlでは、SDP answer送出時に使用するオーディオコーデックを変更することができます。

Defaultが選択されているときに接続開始すると、SDP answerに使用可能なオーディオコーデックのリストが送出されます。

いずれかのオーディオコーデックを選択すると、これが使用可能な唯一のオーディオコーデックとしてSDP answerが送出されるため、これが選択されます。

また、main.js の以下の部分でMIME TYPEを指定する事で、.htmlファイルロード時に選択されているオーディオコーデックを変更することができます。 nullを指定すると Defaultがそのまま選択されます。

```
// select 'audio/PCMU' or other MIME type for audio codec initial selection (if any)
//const codecMimeTypeInitial = 'audio/PCMU'
const codecMimeTypeInitial = null;
```

recvonly.html 側で選択する方法は、Ayameシグナリングサーバーとの組み合わせではうまくオーディオコーデックの選択ができませんでした。

## オーディオデバイスの選択

sendonly.html と sendrecv.htmlではオーディオ入力 (マイク)に使用するデバイスを選択可能です。オーディオ入力デバイスの選択はWebRTC接続前のみ可能です。

recvonly.html と sendrecv.htmlではWebRTCで受信した音声を出力するオーディオ出力デバイスを選択可能です。これはいつでも変更可能です。

オーディオ入力をモニタする音声は、(オーディオ出力デバイスの選択に関係なく)デフォルト出力デバイスに出力されます。
デフォルトの入力/出力オーディオデバイスはWindows10の場合コントロールパネルの「サウンド」や「設定」→「システム」→「サウンド」から変更可能です。

## TypeScript (.ts) ファイルの更新と再ビルド

このディレクトリ内のテスト.htmlファイルは ビルド済みの dist/ayame.js のみを参照します。

ayame-web-sdk の TypeScript (.ts)ファイルを更新し再ビルドするときは、ベースディレクトリで (`yarn install` 実行後に)

`yarn build`

を実行します。
