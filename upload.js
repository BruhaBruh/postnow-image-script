import fs from 'node:fs';

const API_KEY = ''
const INPUT_DIRECTORY = "./input"

const capitalize = (str) => {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

const readFiles = async (extensions) => {
  if (!fs.existsSync(INPUT_DIRECTORY)) {
    console.error("input directory does not exists")
    process.exit(1)
  }

  return fs.readdirSync(INPUT_DIRECTORY)
    .filter(f => extensions.some(e => f.endsWith(`.${e}`)))
}

const uploadImage = async (file) => {
  if (!fs.existsSync(INPUT_DIRECTORY)) {
    console.error("input directory does not exists")
    process.exit(1)
  }

  const body = fs.readFileSync(`${INPUT_DIRECTORY}/${file}`)

  const res = await fetch('https://postnow.ru/api/v1/device/image', {
    method: "POST",
    headers: {
      'Api-Key': API_KEY,
      'Content-Type': 'image/webp'
    },
    body
  })

  const json = await res.json().catch(e => {
    console.error('fail read json of response', e)
    process.exit(1)
  })

  if (!res.ok) {
    console.error(`fail upload ${file}:`, json)
    process.exit(1)
  }

  return json
}

const createDevice = async (file, image) => {
  const deviceNameParts = file.split('.')[0].split('_').map(capitalize)
  const deviceName = deviceNameParts.join(' ')
  const deviceModel = deviceNameParts[deviceNameParts.length - 1]
  const seo = `samsung, самсунг, samsung galaxy ${deviceModel}, samsung ${deviceModel}, самсуг ${deviceModel}, ${deviceModel}`
  
  const res = await fetch('https://postnow.ru/api/v1/device', {
    method: "POST",
    headers: {
      'Api-Key': API_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      slug: deviceNameParts.join('-').toLowerCase(),
      name: deviceName,
      seo,
      vendorSlug: 'samsung',
      deviceTypeSlug: 'phone',
      image,
      defects: [
        {
          id: '3da74fbc-bffd-4ae5-adc1-03e80dfdc2ca',
          slug: 'mobile-vibro'
        },
        {
          id: 'a2d7a101-a166-4526-a048-00db2e15e6a6',
          slug: 'mobile-charge'
        },
        {
          id: '85590b85-3fe8-45fa-a7ba-ddc7a89db693',
          slug: 'mobile-sound'
        },
        {
          id: '86ad8522-c3b4-43b9-acad-681c1e12d484',
          slug: 'mobile-cameras'
        },
        {
          id: '375c5ca1-d33b-4896-b4f2-3d849d6ee6d9',
          slug: 'mobile-buttons'
        },
        {
          id: 'cf3e8de8-cdc8-43a2-b3f8-4f065227cf75',
          slug: 'mobile-case'
        },
        {
          id: 'ce4a01d4-f89b-497d-92e4-ef062010e696',
          slug: 'mobile-obshie-uslugi'
        },
        {
          id: '7324e100-d258-43fa-b1ce-622489749c52',
          slug: 'mobile-network'
        },
        {
          id: '377d08f5-d3d1-456b-824a-02d9a994b6f0',
          slug: 'mobile-screen'
        },
      ]
    })
  })

  const json = await res.json().catch(e => {
    console.error('fail read json of response', e)
    process.exit(1)
  })

  if (!res.ok) {
    console.error(`fail upload ${file}:`, json)
    process.exit(1)
  }

  return json
}

const execute = async (file) => {
  const { image } = await uploadImage(file)

  const { name } = await createDevice(file, image)

  console.info(`${name} created!`)
}

const main = async () => {
  const files = await readFiles(['webp'])

  const chunkSize = 3;
  for (let i = 0; i < files.length; i += chunkSize) {
    const chunk = files.slice(i, i + chunkSize);
    const promises = chunk.map(file => execute(file).catch(console.error))

    await Promise.allSettled(promises)
  }
}


await main()