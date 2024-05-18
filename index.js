import { exec } from 'node:child_process';
import fs from 'node:fs';
import sharp from 'sharp';

const INPUT_DIRECTORY = "./input"
const TEMP_DIRECTORY = "./temp"
const OUTPUT_DIRECTORY = "./output"
const width = 1056
const height = 1008

const removeBackground = async (current, save) => {
  return new Promise((resolve, reject) => {
      let command = `rembg i ${current} ${save}`;
      exec(command, (error, stdout, stderr) => {
          if (error) {
              reject(`error: ${error.message}`)
          }
          if (stderr) {
              reject(`stderr: ${stderr}`)
          }
          resolve(`stdout: ${stdout}`)
      });
  })
}

const resize = async (file) => {
  const image = await sharp(`${INPUT_DIRECTORY}/${file}`)
    .resize({
      width: Math.floor(width * 0.8),
      height: Math.floor(height * 0.8)
    })
    .toBuffer()

  await sharp({
      create: {
        width,
        height,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      }
    })
    .composite([{
      input: image
    }])
    .webp()
    .toFile(`${OUTPUT_DIRECTORY}/${file}`)
}

const main = async () => {
  if (!fs.existsSync(OUTPUT_DIRECTORY)) {
    fs.mkdirSync(OUTPUT_DIRECTORY, { recursive: true })
  }
  const files = fs.readdirSync(INPUT_DIRECTORY).filter(s => s.endsWith(".webp"))

  const chunkSize = 3;
  for (let i = 0; i < files.length; i += chunkSize) {
    const chunk = files.slice(i, i + chunkSize);
    // background remove
    // const processes = chunk.map(file => removeBackground(`${INPUT_DIRECTORY}/${file}`, `${OUTPUT_DIRECTORY}/${file}`))
    // resize for site scale
    const processes = chunk.map(file => resize(file).catch(console.log))
    await Promise.allSettled(processes)
  }
}

await main()