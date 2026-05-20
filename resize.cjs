const Jimp = require('jimp');

async function resizeImages() {
  try {
    const img192 = await Jimp.read('public/pwa-192x192.png');
    await img192.resize(192, 192).writeAsync('public/pwa-192x192.png');
    console.log('Resized pwa-192x192.png');

    const img512 = await Jimp.read('public/pwa-512x512.png');
    await img512.resize(512, 512).writeAsync('public/pwa-512x512.png');
    console.log('Resized pwa-512x512.png');
  } catch (err) {
    console.error(err);
  }
}

resizeImages();
