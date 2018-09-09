const fs = require('fs')
const test = require('tape')
const { PNG } = require('pngjs')
const Palette = require('jascpal')
const SLP = require('../src/SLP')
const SLPEncoder = require('../src/SLPEncoder')

const slpPath = require.resolve('./archer/12.slp')
const pngPath = require.resolve('./archer/15.png')
const palPath = require.resolve('./archer/palette.pal')

const slp = SLP(fs.readFileSync(slpPath))
const palette = Palette(fs.readFileSync(palPath))
const png = PNG.sync.read(fs.readFileSync(pngPath))
normalizeTransparentPixels(png.data)

function normalizeTransparentPixels (data) {
  for (let i = 0; i < data.length; i += 4) {
    if (data[i] === 0xFF && data[i + 1] === 0xFF && data[i + 2] === 0xFF && data[i + 3] === 0) {
      data[i] = data[i + 1] = data[i + 2] = 0
    }
  }
}

test('SLP#renderFrame', (t) => {
  const image = slp.renderFrame(15, palette, { player: 1 })

  t.equal(
    Buffer.from(image.data).toString('base64'),
    png.data.toString('base64'),
    'rendered frame should be same as comparison png'
  )
  t.end()
})

test('SLPEncoder', (t) => {
  const enc = SLPEncoder({
    palette,
    version: '1.00',
    comment: 'Generated by genie-slp'
  })
  enc.addFrame(png) // `width`, `height`, `data` props

  const slpBuffer = enc.encode()
  const slp2 = SLP(slpBuffer)
  slp2.parseHeader()

  t.equal(slp2.comment, 'Generated by genie-slp\0\0')

  const image = slp.renderFrame(15, palette, { player: 1 })
  const image2 = slp2.renderFrame(0, palette, { player: 1 })
  t.equal(
    Buffer.from(image.data).toString('base64'),
    Buffer.from(image2.data).toString('base64'),
    'frame from generated slp should be same as original'
  )
  t.end()
})
