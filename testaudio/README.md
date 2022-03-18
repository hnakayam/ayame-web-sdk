# ayame-web-sdk

## testaudio

オーディオのみ通話するテスト用コードです。以下の順番で実行してください。

1. ベースディレクトリで yarn install を実行し、依存モジュールをインストールしてください。

2. ベースディレクトリで何らかのスタティックWebサーバーを起動してください。

例えば node-static を利用する場合は、以下のようにインストールした後、

npm install -g node-static

ベースディレクトリで以下のように実行します。

static -c 0 .

3. WebRTC対応のブラウザで以下のいずれかのURLを開きます。

http://Localhost:8080/testaudio/sendonly.html

http://Localhost:8080/testaudio/recvonly.html

http://Localhost:8080/testaudio/sendrecv.html

## 動作説明

### sendonly.html

ページを開くとマイクの使用がリクエストされ、その後音声入力が始まります。
このときオーディオコントロールのミュート解除を行うと、マイク音声のモニタが可能です (ハウリング音が発生する場合はヘッドセット等を利用してください)

その後「接続」ボタンを押すとayameシグナリングサーバーに接続します。すでに接続相手がいるか、あるいは新しく接続相手が接続するとWebRTC通話(ただし送信のみ一方向)が始まります。

「切断」ボタンを押すか、相手が切断した場合にはWebRTC通話が終了します。再度WebRTC通話を行うには「接続」ボタンを押してください。

### recvonly.html

このテストではマイクは使用しません。

「接続」ボタンを押すとayameシグナリングサーバーに接続します。すでに接続相手がいるか、あるいは新しく接続相手が接続するとWebRTC通話(ただし受信のみ一方向)が始まります。

「切断」ボタンを押すか、相手が切断した場合にはWebRTC通話が終了します。再度WebRTC通話を行うには「接続」ボタンを押してください。

### sendrecv.html


# Ayame シグナリングサーバー、Room IDの変更

main.jsの以下の記述を変更してください。

const signalingUrl = 'wss://ayame-labo.shiguredo.jp/signaling';
let roomId = 'ayame-test-sdk';

