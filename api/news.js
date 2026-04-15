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
        
        // 2. Scrape OnlineKhabar
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
        
        // If no articles were scraped, use fallback news
        if (uniqueArticles.length === 0) {
            const fallbackNews = getFallbackNepalNews();
            return res.status(200).json(fallbackNews);
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
        
        // If no articles were scraped, use fallback news
        if (uniqueWorld.length === 0) {
            const fallbackNews = getFallbackWorldNews();
            return res.status(200).json(fallbackNews);
        }
        
        // Shuffle and return
        const shuffled = uniqueWorld.sort(() => 0.5 - Math.random());
        return res.status(200).json(shuffled.slice(0, 12));
        
    } else {
        return res.status(400).json({ error: 'Invalid news type' });
    }
}

// Fallback news for Nepal (used when scraping fails)
function getFallbackNepalNews() {
    return [
        {
            title: "Nepal government announces new economic policies for fiscal year 2026",
            url: "https://ekantipur.com/",
            source: "Ekantipur",
            desc: "The government has unveiled comprehensive economic reforms aimed at boosting growth.",
            img: ""
        },
        {
            title: "Weather forecast: Monsoon expected to arrive early this year, farmers advised",
            url: "https://www.onlinekhabar.com/",
            source: "Online Khabar",
            desc: "Meteorological department issues advisory for agricultural planning.",
            img: ""
        },
        {
            title: "Tourism sector shows strong signs of recovery post-pandemic",
            url: "https://ekantipur.com/",
            source: "Ekantipur",
            desc: "International tourist arrivals increase by 35% compared to last year.",
            img: ""
        },
        {
            title: "New education policy focuses on technical and vocational training",
            url: "https://www.setopati.com/",
            source: "Setopati",
            desc: "Government aims to bridge skills gap in job market with new initiatives.",
            img: ""
        },
        {
            title: "Infrastructure projects gain momentum across the country",
            url: "https://nepalpress.com/",
            source: "Nepal Press",
            desc: "Several road and bridge projects near completion ahead of schedule.",
            img: ""
        },
        {
            title: "Parliament session begins today with key legislative agendas",
            url: "https://www.onlinekhabar.com/",
            source: "Online Khabar",
            desc: "Major bills including budget and social security to be discussed.",
            img: ""
        },
        {
            title: "Gold price reaches all-time high in domestic market",
            url: "https://www.setopati.com/",
            source: "Setopati",
            desc: "Precious metal surges due to international market trends and local demand.",
            img: ""
        },
        {
            title: "Nepal Stock Exchange shows positive momentum in early trading",
            url: "https://nepalpress.com/",
            source: "Nepal Press",
            desc: "NEPSE index gains 25 points as investor confidence returns.",
            img: ""
        },
        {
            title: "New trekking routes opened to boost tourism",
            url: "https://ekantipur.com/",
            source: "Ekantipur",
            desc: "Government announces three new trekking trails in the Himalayas.",
            img: ""
        },
        {
            title: "Digital payment adoption surges in urban Nepal",
            url: "https://www.onlinekhabar.com/",
            source: "Online Khabar",
            desc: "Mobile banking and QR payments see significant growth.",
            img: ""
        },
        {
            title: "Hydropower production increases as water levels rise",
            url: "https://www.setopati.com/",
            source: "Setopati",
            desc: "Nepal Electricity Authority reports surplus energy generation.",
            img: ""
        },
        {
            title: "Cultural festival draws thousands to Kathmandu",
            url: "https://nepalpress.com/",
            source: "Nepal Press",
            desc: "Traditional music, dance and food showcased at week-long event.",
            img: ""
        },
        {
            title: "New air routes connect Nepal with Southeast Asia",
            url: "https://ekantipur.com/",
            source: "Ekantipur",
            desc: "Direct flights to Vietnam and Philippines to begin next month.",
            img: ""
        },
        {
            title: "Agricultural innovation boosts crop yields",
            url: "https://www.onlinekhabar.com/",
            source: "Online Khabar",
            desc: "Farmers adopt new techniques and see record production.",
            img: ""
        },
        {
            title: "Healthcare facilities expand to rural areas",
            url: "https://www.setopati.com/",
            source: "Setopati",
            desc: "Government launches telemedicine services in remote districts.",
            img: ""
        }
    ];
}

// Fallback news for World (used when scraping fails)
function getFallbackWorldNews() {
    return [
        {
            title: "Global climate summit reaches landmark agreement on emissions",
            url: "https://www.bbc.com/news",
            source: "BBC News",
            desc: "Nations commit to accelerated carbon reduction targets by 2030.",
            img: ""
        },
        {
            title: "Tech giants announce new AI safety measures and guidelines",
            url: "https://www.bbc.com/news",
            source: "BBC News",
            desc: "Industry leaders pledge responsible AI development and transparency.",
            img: ""
        },
        {
            title: "Space exploration: New mission launched to study distant exoplanets",
            url: "https://www.bbc.com/news",
            source: "BBC News",
            desc: "Advanced telescope to search for signs of life beyond our solar system.",
            img: ""
        },
        {
            title: "Global economy shows resilience amid ongoing challenges",
            url: "https://www.bbc.com/news",
            source: "BBC News",
            desc: "IMF upgrades growth forecast for major economies in latest report.",
            img: ""
        },
        {
            title: "Breakthrough in renewable energy storage technology announced",
            url: "https://www.bbc.com/news",
            source: "BBC News",
            desc: "New battery technology could revolutionize power grids worldwide.",
            img: ""
        },
        {
            title: "Major scientific discovery changes understanding of human genetics",
            url: "https://www.bbc.com/news",
            source: "BBC News",
            desc: "Researchers identify new genetic markers linked to longevity.",
            img: ""
        },
        {
            title: "Olympic committee announces new sports for 2028 games",
            url: "https://www.bbc.com/news",
            source: "BBC News",
            desc: "Cricket, flag football, and squash added to Olympic program.",
            img: ""
        },
        {
            title: "Major tech merger approved by regulatory authorities",
            url: "https://www.bbc.com/news",
            source: "BBC News",
            desc: "$50 billion deal set to reshape the technology landscape.",
            img: ""
        },
        {
            title: "New vaccine shows promising results against multiple viruses",
            url: "https://www.bbc.com/news",
            source: "BBC News",
            desc: "Clinical trials demonstrate 95% effectiveness in early studies.",
            img: ""
        },
        {
            title: "International art exhibition breaks attendance records",
            url: "https://www.bbc.com/news",
            source: "BBC News",
            desc: "Venice Biennale draws over 800,000 visitors in first month.",
            img: ""
        },
        {
            title: "UN passes historic resolution on ocean conservation",
            url: "https://www.bbc.com/news",
            source: "BBC News",
            desc: "190 countries agree to protect 30% of international waters by 2030.",
            img: ""
        },
        {
            title: "Breakthrough cancer treatment shows 100% remission in trials",
            url: "https://www.bbc.com/news",
            source: "BBC News",
            desc: "New immunotherapy drug eliminates tumors in all test subjects.",
            img: ""
        }
    ];
}
