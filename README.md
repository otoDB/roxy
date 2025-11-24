# proxy

## Setup

To install dependencies:

```shell
bun install
```

To run:

```shell
bun run dev
```

open http://localhost:3000

## Test

```shell
# Nicovideo
http localhost:3000 q=="sm44769600"

http localhost:3000 q=="https://www.nicovideo.jp/watch/sm44769600"

# Youtube
http localhost:3000 q=="w6Tjn_M5rTc"

http localhost:3000 q=="https://www.youtube.com/watch?v=w6Tjn_M5rTc"

# Bilibili
http localhost:3000 q=="BV19M4y1h7wM"

http localhost:3000 q=="https://www.bilibili.com/video/BV19M4y1h7wM"

# Soundcloud (Unsupported)
# http localhost:3000 q=="https://soundcloud.com/hxudmdc1lxrs/worldwidepunyapunya"
```
