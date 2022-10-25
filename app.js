import * as d3 from 'https://cdn.skypack.dev/d3@7'
// データを読み込みます
const json = await (await fetch('./Covid19JapanAll.json')).json()
const area = name => {
  if (
    [
      '北海道',
      '青森県',
      '岩手県',
      '秋田県',
      '宮城県',
      '山形県',
      '福島県'
    ].indexOf(name) > -1
  )
    return '北海道・東北'
  if (
    [
      '茨城県',
      '栃木県',
      '群馬県',
      '埼玉県',
      '千葉県',
      '東京都',
      '神奈川県'
    ].indexOf(name) > -1
  )
    return '関東'
  if (
    [
      '新潟県',
      '富山県',
      '石川県',
      '福井県',
      '山梨県',
      '長野県',
      '岐阜県',
      '静岡県',
      '愛知県'
    ].indexOf(name) > -1
  )
    return '中部'
  if (
    [
      '三重県',
      '滋賀県',
      '奈良県',
      '和歌山県',
      '京都府',
      '大阪府',
      '兵庫県'
    ].indexOf(name) > -1
  )
    return '近畿'
  if (['岡山県', '広島県', '鳥取県', '島根県', '山口県'].indexOf(name) > -1)
    return '中国'
  if (['香川県', '徳島県', '愛媛県', '高知県'].indexOf(name) > -1) return '四国'
  if (
    [
      '福岡県',
      '佐賀県',
      '長崎県',
      '大分県',
      '熊本県',
      '宮崎県',
      '鹿児島県',
      '沖縄県'
    ].indexOf(name) > -1
  )
    return '九州・沖縄'
}
// データをフィルタリングして', '2022年02月01日のデータのみ/並びを感染者数の多い順としています
const data = json.itemList
  .filter(d => d.date === '2022-02-01')
  .map(data => {
    data.area = area(data.name_jp)
    data.npatients = parseInt(data.npatients)
    return data
  })



// グラフの幅と高さ
const width = 400
const height = 500
const colors = d3.schemeTableau10 // 色のテーマ
// 描画用マージン
const margin = {
  top: 1,
  bottom: 1,
  right: 1,
  left: 1
}

// 描画用
const D = d3.map(data, d => d) // リンク用
const V = d3.map(data, d => d.npatients) // バブルの大きさ
const G = d3.map(data, d => d.area) // グルーピング
const I = d3.range(V.length).filter(i => V[i] > 0) // グルーピング
const L = d3.map(data, d => [d.name_jp, d.npatients].join('\n')) // ラベル

const link = d => `https://exaple.com/coronavirus/data/pref/${d.name_jp}.html` // リンク
const groups = new d3.InternSet(I.map(i => G[i])) // ユニークなグループを作成
const color = d3.scaleOrdinal(groups, colors) // 色の種類を決める

// レイアウトの処理
const padding = 3
const root = d3
  .pack()
  .size([
    width - margin.left - margin.right,
    height - margin.top - margin.bottom
  ])
  .padding(padding)(d3.hierarchy({ children: I }).sum(i => V[i]))

// グラフ領域の作成
const svg = d3
  .select('#graph')
  .attr('width', width)
  .attr('height', height)
  .attr('viewBox', [-margin.left, -margin.top, width, height])
  .attr('style', 'max-width: 100%; height: auto; height: intrinsic;')
  .attr('fill', 'currentColor')
  .attr('font-size', 10)
  .attr('font-family', 'sans-serif')
  .attr('text-anchor', 'middle')

// リンクの作成
const leaf = svg
  .selectAll('a')
  .data(root.leaves())
  .join('a')
  .attr('xlink:href', (d, i) => link(D[d.data], i, data))
  .attr('target', '_blank')
  .attr('transform', d => `translate(${d.x}, ${d.y})`)

// バブルの描画
const stroke = 'grey'
const strokeWidth = null
const strokeOpacity = null
const fillOpacity = 0.7
leaf
  .append('circle')
  .attr('stroke', stroke)
  .attr('stroke-width', strokeWidth)
  .attr('stroke-opacity', strokeOpacity)
  .attr('fill', d => color(G[d.data]))
  .attr('fill-opacity', fillOpacity)
  .attr('r', d => d.r)

// ユニークなIDを生成
const uid =`O - ${Math.random().toString(16).slice(2)}`
// 文字が溢れた部分を切り抜き
leaf
  .append('clipPath')
  .attr('id', d => `${uid}-clip-${d.data}`)
  .append('circle')
  .attr('r', d => d.r)

// ラベルの描画
leaf
  .append('text')
  .attr('clip-path', d => `url(${new URL(`#${uid}-clip-${d.data}`, location)})`)
  .selectAll('tspan')
  .data(d => `${L[d.data]}`.split(/\n/g))
  .join('tspan')
  .attr('x', 0)
  .attr('y', (d, i, D) => `${i - D.length / 2 + 0.85}em`)
  .attr('fill-opacity', (d, i, D) => (i === D.length - 1 ? 0.7 : null))
  .text(d => d)
