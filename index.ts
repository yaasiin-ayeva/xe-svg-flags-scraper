const fs = require('fs');
const path = require('path');
const axios = require('axios');
const cheerio = require('cheerio');

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

const main = async (htmlFilePath: string) => {

    const outputDir = 'output/images';
    const jsonPath = 'output/currencies.json';

    const html = fs.readFileSync(htmlFilePath, 'utf8');
    const $ = cheerio.load(html);

    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    const imageData = [];

    $('li img').each((_, img) => {
        const url = $(img).attr('src');
        const alt = $(img).attr('alt');
        const description = $(img).closest('li').find('.description').text().trim();
        const code = alt.toLowerCase();
        const filename = `${code}.svg`;
        const outputPath = path.join(outputDir, filename);

        if (url && alt && description) {
            imageData.push({ code, description, filename });
            downloadImage(url, outputPath)
                .then(() => console.log(`Downloaded: ${url}`))
                .catch(error => console.error(`Failed to download ${url}: ${error.message}`));
        }
    });

    fs.writeFileSync(jsonPath, JSON.stringify(imageData, null, 2));
    console.log(`Created JSON file: ${jsonPath}`);
};

const htmlFilePath = 'public/flags.html';
main(htmlFilePath);
