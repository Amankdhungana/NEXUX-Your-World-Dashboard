

export default async function handler(req, res) {
    const { type } = req.query; // 'nepal' or 'world'
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    if (type === 'nepal') {
        const allArticles = [];
        
        // 1. Scrape Ekantipur
        try {
            const response = await fetch('https://ekantipur.com/', {
                headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
            });
            const html = await response.text();
            const cheerio = require('cheerio');
            const $ = cheerio.load(html);
            
            $('.news_face, .teaser, article, .post-item').each((i, el) => {
                const title = $(el).find('h1, h2, h3, .title, .heading').first().text().trim();
                let link = $(el).find('a').first().attr('href');
                let img = $(el).find('img').first().attr('src');
                
                if (title && title.length > 20 && title.length < 200) {
                    if (link && !link.startsWith('http')) {
                        link = 'https://ekantipur.com' + link;
                    }
                    if (img && !img.startsWith('http')) {
                        img = 'https://ekantipur.com' + img;
                    }
                    allArticles.push({
                        title: title.substring(0, 120),
                        url: link || '#',
                        source: 'Ekantipur',
                        desc: '',
                        img: img || ''
                    });
                }
            });
        } catch(e) { console.error('Ekantipur error:', e.message); }
        try {
            const response = await fetch('https://www.onlinekhabar.com/', {
                headers: { 'User-Agent': 'Mozilla/5.0' }
            });
            const html = await response.text();
            const cheerio = require('cheerio');
            const $ = cheerio.load(html);
            
            $('.post-title, .article-title, h2 a, h3 a').each((i, el) => {
                const title = $(el).text().trim();
                let link = $(el).attr('href');
                let img = $(el).closest('article').find('img').first().attr('src');
                
                if (title && title.length > 20 && title.length < 200) {
                    if (link && !link.startsWith('http')) {
                        link = 'https://www.onlinekhabar.com' + link;
                    }
                    if (img && !img.startsWith('http')) {
                        img = 'https://www.onlinekhabar.com' + img;
                    }
                    allArticles.push({
                        title: title.substring(0, 120),
                        url: link || '#',
                        source: 'Online Khabar',
                        desc: '',
                        img: img || ''
                    });
                }
            });
        } catch(e) { console.error('OnlineKhabar error:', e.message); }
        
        // 3. Scrape Setopati
        try {
            const response = await fetch('https://www.setopati.com/', {
                headers: { 'User-Agent': 'Mozilla/5.0' }
            });
            const html = await response.text();
            const cheerio = require('cheerio');
            const $ = cheerio.load(html);
            
            $('.article-title, .title, h2 a, h3 a').each((i, el) => {
                const title = $(el).text().trim();
                let link = $(el).attr('href');
                let img = $(el).closest('.article').find('img').first().attr('src');
                
                if (title && title.length > 20 && title.length < 200) {
                    if (link && !link.startsWith('http')) {
                        link = 'https://www.setopati.com' + link;
                    }
                    if (img && !img.startsWith('http')) {
                        img = 'https://www.setopati.com' + img;
                    }
                    allArticles.push({
                        title: title.substring(0, 120),
                        url: link || '#',
                        source: 'Setopati',
                        desc: '',
                        img: img || ''
                    });
                }
            });
        } catch(e) { console.error('Setopati error:', e.message); }
        
        // 4. Scrape Nepal Press
        try {
            const response = await fetch('https://nepalpress.com/', {
                headers: { 'User-Agent': 'Mozilla/5.0' }
            });
            const html = await response.text();
            const cheerio = require('cheerio');
            const $ = cheerio.load(html);
            
            $('.entry-title, h2 a, .post-title').each((i, el) => {
                const title = $(el).text().trim();
                let link = $(el).attr('href');
                let img = $(el).closest('.post').find('img').first().attr('src');
                
                if (title && title.length > 20 && title.length < 200) {
                    if (link && !link.startsWith('http')) {
                        link = 'https://nepalpress.com' + link;
                    }
                    if (img && !img.startsWith('http')) {
                        img = 'https://nepalpress.com' + img;
                    }
                    allArticles.push({
                        title: title.substring(0, 120),
                        url: link || '#',
                        source: 'Nepal Press',
                        desc: '',
                        img: img || ''
                    });
                }
            });
        } catch(e) { console.error('NepalPress error:', e.message); }
        
        // Remove duplicates (same title)
        const uniqueArticles = [];
        const titles = new Set();
        for (const article of allArticles) {
            if (!titles.has(article.title)) {
                titles.add(article.title);
                uniqueArticles.push(article);
            }
        }
        
        // Shuffle and return top 15
        const shuffled = uniqueArticles.sort(() => 0.5 - Math.random());
        return res.status(200).json(shuffled.slice(0, 15));
        
    } else if (type === 'world') {
        const worldArticles = [];
        
        // 1. BBC News
        try {
            const response = await fetch('https://feeds.bbci.co.uk/news/world/rss.xml');
            const text = await response.text();
            const parser = require('xml2js').parseString;
            
            await new Promise((resolve) => {
                parser(text, (err, result) => {
                    if (!err && result?.rss?.channel?.[0]?.item) {
                        const items = result.rss.channel[0].item.slice(0, 12);
                        items.forEach(item => {
                            let imgUrl = '';
                            if (item['media:thumbnail']) {
                                imgUrl = item['media:thumbnail'][0].$.url;
                            } else if (item['media:content']) {
                                imgUrl = item['media:content'][0].$.url;
                            }
                            worldArticles.push({
                                title: item.title?.[0]?.substring(0, 120) || '',
                                url: item.link?.[0] || '#',
                                source: 'BBC News',
                                desc: item.description?.[0]?.substring(0, 200) || '',
                                img: imgUrl
                            });
                        });
                    }
                    resolve();
                });
            });
        } catch(e) { console.error('BBC error:', e.message); }
        
        // 2. CNN (via RSS)
        try {
            const response = await fetch('http://rss.cnn.com/rss/edition.rss');
            const text = await response.text();
            const parser = require('xml2js').parseString;
            
            await new Promise((resolve) => {
                parser(text, (err, result) => {
                    if (!err && result?.rss?.channel?.[0]?.item) {
                        const items = result.rss.channel[0].item.slice(0, 10);
                        items.forEach(item => {
                            let imgUrl = '';
                            if (item['media:thumbnail']) {
                                imgUrl = item['media:thumbnail'][0].$.url;
                            } else if (item['media:content']) {
                                imgUrl = item['media:content'][0].$.url;
                            }
                            worldArticles.push({
                                title: item.title?.[0]?.substring(0, 120) || '',
                                url: item.link?.[0] || '#',
                                source: 'CNN',
                                desc: item.description?.[0]?.substring(0, 200)?.replace(/<[^>]*>/g, '') || '',
                                img: imgUrl
                            });
                        });
                    }
                    resolve();
                });
            });
        } catch(e) { console.error('CNN error:', e.message); }
        
        // 3. Al Jazeera
        try {
            const response = await fetch('https://www.aljazeera.com/xml/rss/all.xml');
            const text = await response.text();
            const parser = require('xml2js').parseString;
            
            await new Promise((resolve) => {
                parser(text, (err, result) => {
                    if (!err && result?.rss?.channel?.[0]?.item) {
                        const items = result.rss.channel[0].item.slice(0, 10);
                        items.forEach(item => {
                            let imgUrl = '';
                            if (item['media:thumbnail']) {
                                imgUrl = item['media:thumbnail'][0].$.url;
                            } else if (item['media:content']) {
                                imgUrl = item['media:content'][0].$.url;
                            }
                            worldArticles.push({
                                title: item.title?.[0]?.substring(0, 120) || '',
                                url: item.link?.[0] || '#',
                                source: 'Al Jazeera',
                                desc: item.description?.[0]?.substring(0, 200)?.replace(/<[^>]*>/g, '') || '',
                                img: imgUrl
                            });
                        });
                    }
                    resolve();
                });
            });
        } catch(e) { console.error('AlJazeera error:', e.message); }
        
        // 4. The Guardian
        try {
            const response = await fetch('https://www.theguardian.com/world/rss');
            const text = await response.text();
            const parser = require('xml2js').parseString;
            
            await new Promise((resolve) => {
                parser(text, (err, result) => {
                    if (!err && result?.rss?.channel?.[0]?.item) {
                        const items = result.rss.channel[0].item.slice(0, 10);
                        items.forEach(item => {
                            worldArticles.push({
                                title: item.title?.[0]?.substring(0, 120) || '',
                                url: item.link?.[0] || '#',
                                source: 'The Guardian',
                                desc: item.description?.[0]?.substring(0, 200)?.replace(/<[^>]*>/g, '') || '',
                                img: ''
                            });
                        });
                    }
                    resolve();
                });
            });
        } catch(e) { console.error('Guardian error:', e.message); }
        
        // Remove duplicates
        const uniqueWorld = [];
        const titles = new Set();
        for (const article of worldArticles) {
            if (!titles.has(article.title)) {
                titles.add(article.title);
                uniqueWorld.push(article);
            }
        }
        
        // Shuffle and return
        const shuffled = uniqueWorld.sort(() => 0.5 - Math.random());
        return res.status(200).json(shuffled.slice(0, 12));
        
    } else {
        return res.status(400).json({ error: 'Invalid news type' });
    }
}