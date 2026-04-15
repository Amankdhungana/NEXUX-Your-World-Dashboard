// api/news.js
export default async function handler(req, res) {
    const { type } = req.query; // 'nepal' or 'world'
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    if (type === 'nepal') {
        const articles = [];
        // Scrape eKantipur
        try {
            const r = await fetch('https://ekantipur.com/', { headers: { 'User-Agent': 'Mozilla/5.0' } });
            const html = await r.text();
            const cheerio = require('cheerio');
            const $ = cheerio.load(html);
            $('a[href]').each((i, el) => {
                const text = $(el).text().trim();
                let href = $(el).attr('href');
                if (text.length > 30 && href && href.includes('ekantipur.com')) {
                    const fullUrl = href.startsWith('http') ? href : 'https://ekantipur.com' + href;
                    articles.push({ title: text.slice(0,120), url: fullUrl, source: 'Ekantipur', desc: '', img: '' });
                }
            });
        } catch(e) {}
        // Fallback if empty
        if (articles.length === 0) {
            return res.json([
                { title: "Nepal government announces new economic policies", url: "#", source: "Ekantipur", desc: "", img: "" },
                { title: "Weather forecast: Monsoon expected early", url: "#", source: "Online Khabar", desc: "", img: "" }
            ]);
        }
        res.json(articles.slice(0,12));
    } else if (type === 'world') {
        try {
            const r = await fetch('https://feeds.bbci.co.uk/news/world/rss.xml');
            const text = await r.text();
            const parser = require('xml2js').parseString;
            parser(text, (err, result) => {
                if (err) throw err;
                const items = result.rss.channel[0].item.slice(0,10);
                const articles = items.map(item => ({
                    title: item.title[0],
                    url: item.link[0],
                    source: 'BBC News',
                    desc: item.description ? item.description[0].slice(0,200) : '',
                    img: item['media:thumbnail'] ? item['media:thumbnail'][0].$.url : ''
                }));
                res.json(articles);
            });
        } catch(e) {
            res.json([{ title: "Global climate summit reaches agreement", url: "#", source: "BBC", desc: "", img: "" }]);
        }
    } else {
        res.status(400).json({ error: 'Invalid news type' });
    }
}
