const express = require('express')
const multer = require('multer')
const ffmpeg = require('fluent-ffmpeg')
const fs = require('fs')
const path = require('path')
const { v4: uuid } = require('uuid')
const cors = require('cors')

const app = express()
const port = process.env.PORT || 3000

app.use(cors())
app.use(express.static('processed'))

const upload = multer({ dest: 'uploads/' })

// Compress video
app.post('/compress', upload.single('video'), (req, res) => {
  const input = req.file.path
  const output = `processed/${uuid()}.mp4`

  ffmpeg(input)
    .videoCodec('mpeg4')
    .on('end', () => {
      res.sendFile(path.resolve(output))
      fs.unlinkSync(input)
    })
    .on('error', err => {
      console.error('Error:', err)
      res.status(500).send('Compression failed')
    })
    .save(output)
})

// Blend video + audio
app.post(
  '/blend',
  upload.fields([
    { name: 'video', maxCount: 1 },
    { name: 'audio', maxCount: 1 }
  ]),
  (req, res) => {
    const videoPath = req.files['video'][0].path
    const audioPath = req.files['audio'][0].path
    const output = `processed/${uuid()}.mp4`

    ffmpeg()
      .input(videoPath)
      .input(audioPath)
      .outputOptions('-map 0:v:0', '-map 1:a:0', '-shortest')
      .on('end', () => {
        res.sendFile(path.resolve(output))
        fs.unlinkSync(videoPath)
        fs.unlinkSync(audioPath)
      })
      .on('error', err => {
        console.error('Error:', err)
        res.status(500).send('Blend failed')
      })
      .save(output)
  }
)

app.listen(port, () => {
  console.log(`🚀 FFmpeg backend running at http://localhost:${port}`)
})
