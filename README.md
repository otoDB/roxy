# Roxy

https://roxy.otodb.net/xml?q=sm42246476

```shell
# Nicovideo
http https://roxy.otodb.net/xml q=="sm42246476" | xq -x "data/title"

http https://roxy.otodb.net/xml q=="https://www.nicovideo.jp/watch/sm44769600" | xq -x "data/thumbnail"

# Youtube
http https://roxy.otodb.net/xml q=="w6Tjn_M5rTc" | xq -x "data/title"

http https://roxy.otodb.net/xml q=="https://www.youtube.com/watch?v=w6Tjn_M5rTc" | xq -x "data/title"

# Bilibili
http https://roxy.otodb.net/xml q=="BV19M4y1h7wM" | xq -x "data/title"

http https://roxy.otodb.net/xml q=="https://www.bilibili.com/video/BV19M4y1h7wM" | xq -x "data/title"

# SoundCloud
http https://roxy.otodb.net/xml q=="https://soundcloud.com/hxudmdc1lxrs/worldwidepunyapunya" | xq -x "data/title"
```

様々な動画サイトから透過的に音MADのタイトルやサムネイルをベストエフォートで取得するプロキシです．
[otoDB](https://otodb.net)に登録されている場合はそちらのデータを参照し，まだ登録されていない場合は各動画サイトから可能な限りタイトルなどを取得します．
Googleスプレッドシートの利用を特に想定しているのでXMLのデータを返却するようにしています．

## Usage

### Google Spreadsheet

[使用例](https://docs.google.com/spreadsheets/d/1a_P3bdOOKh7cOy6jwhB2ObHD_DrIIWC-2QwdnLqbawc?usp=sharing)

動画の情報は`A2`セルに入っているものと仮定します．

次の関数で動画タイトルが取得できます．

```
=IF(A2<>"", IMPORTXML(CONCATENATE("https://roxy.otodb.net/xml?q=", A2),"/data/title"), "")
```

次の関数でサムネイルのURLが取得できます．

```
=IF(A2<>"", IMAGE(IMPORTXML(CONCATENATE("https://roxy.otodb.net/xml?q=", A2),"/data/thumbnail")), "")
```

次の関数で識別子が取得できます．重複チェックなどに利用出来ます．

```
=IF(A2<>"", IMAGE(IMPORTXML(CONCATENATE("https://roxy.otodb.net/xml?q=", A2),"/data/identifier")), "")
```

集計用の機能に関しては["nerdtronics2の振り返り③ (選曲管理/音MAD-mix監修) #ナートロ2"](https://owatax00.hatenablog.com/entry/2022/12/16/220025) のスプレッドシートなどを参考にすると良いかもしれません．

## Setup

To install dependencies:

```shell
bun install
```

To run:

```shell
bun run dev
```

open http://localhost:8787

## Test

```shell
# Nicovideo
http localhost:8787/xml q=="sm44769600"

http localhost:8787/xml q=="https://www.nicovideo.jp/watch/sm44769600"

# Youtube
http localhost:8787/xml q=="w6Tjn_M5rTc"

http localhost:8787/xml q=="https://www.youtube.com/watch?v=w6Tjn_M5rTc"

# Bilibili
http localhost:8787/xml q=="BV19M4y1h7wM"

http localhost:8787/xml q=="https://www.bilibili.com/video/BV19M4y1h7wM"

# Soundcloud
http localhost:8787/xml q=="https://soundcloud.com/hxudmdc1lxrs/worldwidepunyapunya"
```

## License

[MIT License](./LICENSE)

## Acknowledgement

[sm42246476](https://www.nicovideo.jp/watch/sm42246476)
