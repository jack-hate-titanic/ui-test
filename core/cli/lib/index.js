// 需要填入尺寸
const puppeteer = require("puppeteer");
const fs = require('fs-extra');
const Jimp = require('jimp');
const log = require('@wson-koa2-cli/log');

const { website, webSizes, routers, threshold } = require(`${process.cwd()}/screenshot.config`); 

async function start(params) {
  if (params[0] === 'before') {
    try {
      const dir = './screenshot/before/';
      await fs.remove(dir);
      await screenShotBySize(dir);
      log.info('cli', '所有页面截屏完成');
    } catch (error) {
      log.info('cli', error);
    }
  } else if (params[0] === 'diff') {
    try {
      await imgDiff();
      log.info('cli', '所有页面对比完成');
    } catch (error) {
      log.info('cli', error);
    }
  }
}

async function imgDiff() {
  const dir = "./screenshot/after/";
  const diffDir = "./screenshot/diff/";
  await fs.remove(dir);
  await fs.remove(diffDir);
  await screenShotBySize(dir);
  webSizes.forEach(async (size) => {
    await fs.ensureDirSync(`${diffDir}${size.width}*${size.height}`);
    routers.forEach(async (pageName) => {
      await diff(pageName, size);
    })
  })
 
  
}

async function diff(pageName, size) {
   //原图
  let origin_img = await Jimp.read(`./screenshot/before/${size.width}*${size.height}/${pageName}.png`);
   //模板
   let template_img = await Jimp.read(`./screenshot/after/${size.width}*${size.height}/${pageName}.png`);
   //像素对比
   const diff = Jimp.diff(origin_img, template_img, threshold)
   await diff.image.quality(90).writeAsync(`./screenshot/diff/${size.width}*${size.height}/${pageName}.png`)
}

async function screenshot(pageName, dir, size) {
  const browser = await puppeteer.launch({
    timeout: 15000, //设置超时时间,
  }); //打开浏览器

  const page = await browser.newPage(); //打开一个空白页
  await page.setViewport({
    width: size.width,
    height: size.height,
    isMobile: true
  });

  // 建议使用这种方式，可以防止浏览器超时
  page.goto(`${website}/${pageName}`, { timeout: 60000 }).then(() => {
    log.info('cli', `跳转${size.width}*${size.height}尺寸${pageName}页面成功`);
  }, () => {
    log.info('cli', `跳转${size.width}*${size.height}尺寸${pageName}页面，加载超时`);
  }); //在地址栏输入网址并等待加载

  await page.waitForNavigation({
    waitUntil: 'networkidle0'
  });
  await page.screenshot({
    path: `${dir}/${pageName}.png`, // 图片保存路径
    fullpage: true  // 是否截取全屏幕
  }); //截个图
  await browser.close(); //关掉浏览器
}

async function screenShotBySize(imgDir) {
  return await Promise.all(
    webSizes.map(async (size) => {
      let dir = `${imgDir}${size.width}*${size.height}`;
      await fs.ensureDirSync(dir);
      return await screenShotByRouters(dir, size);
    })
  )
}

async function screenShotByRouters(dir, size) {
  return await Promise.all(
    routers.map(async (pageName) => {
      return await screenshot(pageName, dir, size);
    })
  )
} 

async function cli(params) {
  start(params);
}

module.exports = cli;