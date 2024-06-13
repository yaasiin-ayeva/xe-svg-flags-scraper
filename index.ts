const fs = require('fs');
const path = require('path');
const axios = require('axios');
const cheerio = require('cheerio');
const archiver = require('archiver');

const downloadImage = async (url: string, outputPath: string) => {
    const response = await axios({
        url,
        method: 'GET',
        responseType: 'stream'
    });

    return new Promise((resolve, reject) => {
        const writer = fs.createWriteStream(outputPath);
        response.data.pipe(writer);
        writer.on('finish', resolve);
        writer.on('error', reject);
    });
};

const createZip = (sourceDir: string, zipPath: string) => {
    return new Promise((resolve, reject) => {
        const output = fs.createWriteStream(zipPath);
        const archive = archiver('zip', { zlib: { level: 9 } });

        output.on('close', resolve);
        archive.on('error', reject);

        archive.pipe(output);
        archive.directory(sourceDir, false);
        archive.finalize();
    });
};

const main = async (htmlFilePath: string) => {
    const outputDir = 'images';
    const zipPath = 'images.zip';

    const html = fs.readFileSync(htmlFilePath, 'utf8');
    const $ = cheerio.load(html);

    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir);
    }

    const imageUrls = [];
    $('li img').each((_: any, img: any) => {
        const url = $(img).attr('src');
        if (url) {
            imageUrls.push(url);
        }
    });

    for (const url of imageUrls) {
        const filename = path.basename(url);
        const outputPath = path.join(outputDir, filename);
        try {
            await downloadImage(url, outputPath);
            console.log(`Downloaded: ${url}`);
        } catch (error) {
            console.error(`Failed to download ${url}: ${error.message}`);
        }
    }

    try {
        await createZip(outputDir, zipPath);
        console.log(`Created ZIP file: ${zipPath}`);
    } catch (error) {
        console.error(`Failed to create ZIP file: ${error.message}`);
    }
};

const htmlFilePath = 'public/flags.html';
main(htmlFilePath);
