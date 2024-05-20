import { exec } from 'node:child_process';
import fs from 'node:fs';
import sharp from 'sharp';

/** @type {'nothing' | 'removeBackground' | 'resize' | 'resizeAndRemoveBackground'} */
const PROCESS_TYPE = 'nothing'

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

const resize = async (file, output) => {
  const image = await sharp(file)
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
    .toFile(output)
}

const readFiles = async (extensions) => {
  if (!fs.existsSync(INPUT_DIRECTORY)) {
    console.error("input directory does not exists")
    process.exit(1)
  }
  const fileNamesWithExtension = fs.readdirSync(INPUT_DIRECTORY)
    .filter(f => extensions.some(e => f.endsWith(`.${e}`)))

  const fileNames = fileNamesWithExtension
    .map(f => { 
      const name = f.split('.'); 
      return [f, name[0]] 
    })

  return fileNames
}

const process = async (file, name) => {
  if (PROCESS_TYPE === 'removeBackground' || PROCESS_TYPE === 'resizeAndRemoveBackground') {
    await removeBackground(`${INPUT_DIRECTORY}/${file}`, `${TEMP_DIRECTORY}/${name}.webp`);
  } else {
    fs.copyFileSync(`${INPUT_DIRECTORY}/${file}`, `${TEMP_DIRECTORY}/${name}.webp`);
  }

  if (PROCESS_TYPE === 'resize' || PROCESS_TYPE === 'resizeAndRemoveBackground') {
    await resize(`${TEMP_DIRECTORY}/${name}.webp`, `${OUTPUT_DIRECTORY}/${name}.webp`)
  } else {
    fs.copyFileSync(`${TEMP_DIRECTORY}/${name}.webp`, `${OUTPUT_DIRECTORY}/${name}.webp`)
  }
}

const prepare = () => {
  if (fs.existsSync(TEMP_DIRECTORY)) {
    fs.rmSync(TEMP_DIRECTORY, { recursive: true })
  }
  fs.mkdirSync(TEMP_DIRECTORY, { recursive: true })
  if (fs.existsSync(OUTPUT_DIRECTORY)) {
    fs.rmSync(OUTPUT_DIRECTORY, { recursive: true })
  }
  fs.mkdirSync(OUTPUT_DIRECTORY, { recursive: true })
}

const main = async () => {
  prepare()
  const files = await readFiles(['webp', 'png'])

  const chunkSize = 3;
  for (let i = 0; i < files.length; i += chunkSize) {
    const chunk = files.slice(i, i + chunkSize);
    const promises = chunk.map(([file, name]) => process(file, name))

    await Promise.allSettled(promises)
  }
}

await main()