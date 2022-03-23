/**
 * @typedef {string} ConnectionDirection - オーディオ、ビデオの送受信方向に関するオプションです。
 *
 * - sendrecv
 * - recvonly
 * - sendonly
 */
export declare type ConnectionDirection = 'sendrecv' | 'recvonly' | 'sendonly';
/**
 * @public
 * @typedef {string} AudioCodecOption - オーディオ接続のコーデックに関する標準オプションです。
 *
 * 以下のオプションはSDPで利用されている文字列です
 *
 * - opus
 * - ISAC
 * - G722
 * - PCMU
 * - PCMA
 * - red
 */
export declare type AudioCodecOption = 'opus' | 'ISAC' | 'G722' | 'PCMU' | 'PCMA' | 'red';
/**
 * @typedef {Object} ConnectionAudioOption - オーディオ接続に関するオプションです。
 * @property {AudioCodecOption} codec コーデックの設定(オプション)
 * @property {ConnectionDirection} direction 送受信方向
 * @property {boolean} enabled 有効かどうかのフラグ
 */
export interface ConnectionAudioOption {
    codec?: AudioCodecOption;
    direction: ConnectionDirection;
    enabled: boolean;
}
/**
 * @public
 * @typedef {string} VideoCodecOption - ビデオ接続のコーデックに関するオプションです。
 *
 * - VP8
 * - VP9
 * - H264
 */
export declare type VideoCodecOption = 'VP8' | 'VP9' | 'AV1' | 'H264' | 'H265';
/**
 * @typedef {Object} ConnectionVideoOption - ビデオ接続に関するオプションです。
 * @property {VideoCodecOption} codec コーデックの設定(オプション)
 * @property {ConnectionDirection} direction 送受信方向
 * @property {boolean} enabled 有効かどうかのフラグ
 */
export interface ConnectionVideoOption {
    codec?: VideoCodecOption;
    direction: ConnectionDirection;
    enabled: boolean;
}
/**
 * @typedef {Object} ConnectionOptions - 接続時に指定するオプションです。
 * @property {ConnectionAudioOption} audio オーディオの設定
 * @property {ConnectionVideoOption} video ビデオの設定
 * @property {string} clientId クライアントID
 * @property {Array.<RTCIceServer>} iceServers ayame server から iceServers が返って来なかった場合に使われる iceServer の情報
 * @property {string} signalingKey 送信するシグナリングキー
 */
export interface ConnectionOptions {
    audio: ConnectionAudioOption;
    video: ConnectionVideoOption;
    clientId: string;
    iceServers: Array<RTCIceServer>;
    signalingKey?: string;
}
/**
 * @typedef {Object} MetadataOption - 接続時に指定できるメタデータです。
 * @property {any} authnMetadata 送信するメタデータ
 */
export interface MetadataOption {
    authnMetadata?: any;
}
