このレポジトリでは、Opentype.jsを利用してフォントのメトリクスを可視化するWebサイトを開発します。

# 機能
Google Fontsからフォントをロードし、Opentype.jsでメトリクスを取得して、メトリクスをテキスト上に可視化するというWebサイトです。

## レイアウト

１カラムレイアウトです。
上から順に、

- Visualizer
- text input (textarea, default = "Hej!")
- Parameters
  - font family (select, default = Inter)
  - font size (input type=number, default = 100px)
  - line height auto (checkbox, default=checked)
  - line height (input type=number, default=1.2)

という感じに並べます。

- body background color: gray
- visualizer background color: white

として、Visualizerの範囲がどこかわかりやすくしましょう。


## Visualizer

Visualizer部分にはtext inputの内容を指定されたフォントで表示し、そのbg/fgにbaseline, mean lineなどを表示します。


## 前提条件

- Codepenで動作させたいので、VanillaJS + VanillaCSSで書くこと
