# Roxy

```shell
http https://otodb-roxy.me-411.workers.dev/xml q=="sm2057168" | xq -x "data/title"
```

様々な動画サイトから透過的に音MADのタイトルやサムネイルをベストエフォートで取得するプロキシです．
otoDBに登録されている場合はそちらのデータを参照し，まだ登録されていない場合は各動画サイトから可能な限りタイトルなどを取得します．

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

# Soundcloud (Unsupported)
# http localhost:8787 q=="https://soundcloud.com/hxudmdc1lxrs/worldwidepunyapunya"
```

## License

[MIT License](./LICENSE)

## Acknowledgement

[sm42246476](https://www.nicovideo.jp/watch/sm42246476)
