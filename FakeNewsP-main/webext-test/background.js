chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'GET_TITLE') {

        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            chrome.scripting.executeScript({
                target: { tabId: tabs[0].id },
                func: extractTitle
            }, (results) => {
                if (results && results[0]) {
                    const title = results[0].result; 
                    sendResponse({ title: title }); 
                } else {
                    sendResponse({ title: 'Title not found' });
                }
            });
        });

        
        return true;
    }
});


chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'GET_ARTICLE_CONTENT') {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            chrome.scripting.executeScript({
                target: { tabId: tabs[0].id },
                func: extractArticleContent
            }, (results) => {
                if (results && results[0]) {
                    const { articleBody } = results[0].result;
                    console.log(articleBody);
                    sendResponse({ articleBody: articleBody }); 
                } else {
                    sendResponse({ articleBody: 'Article body not found' });
                }
            });
        });

        return true;
    }
});

// Content script function to extract the title and article body
function extractArticleContent() {


    // Extract article body
    const detailDiv = document.querySelector('div.detail');
    let articleBody = '';

    if (detailDiv) {
        const paragraphs = detailDiv.querySelectorAll('p');
        paragraphs.forEach((p) => {
            const textContent = p.textContent.trim();
            if (textContent.length > 50) { 
                articleBody += textContent + '\n\n'; // Add paragraph text to the article body
            }
        });
    }

    return { articleBody: articleBody };

}


function extractArticleContent() {
    const hostname = window.location.hostname;
    let articleBody = '';

    if (hostname.includes('timesofindia.indiatimes.com')) {
       
        const container = document.querySelector('div._s30J');
        if (container) {
            const temp = document.createElement('div');
            temp.innerHTML = container.innerHTML;
            temp.querySelectorAll('[id^="taboola"], .trc_related_container, .mgid_second_mrec_parent, .vdo_embedd').forEach(el => el.remove());
            temp.querySelectorAll('br').forEach(br => br.replaceWith('\n'));
            articleBody = temp.textContent.trim();
        }

    } else if (hostname.includes('bbc.com')) {
        const articleBlocks = document.querySelectorAll('div.sc-3b6b161a-0.dEGcKf');
        articleBlocks.forEach(block => {
       
        const paragraphs = block.querySelectorAll('p');
        paragraphs.forEach(p => {
            const text = p.textContent.trim();
            if (text.length > 0) {
                articleBody += text + '\n\n';
            }
        });
    });
    } else if (hostname.includes('hindustantimes.com')) {
      
        const detailDiv = document.querySelector('div.detail');
        if (detailDiv) {
            const paragraphs = detailDiv.querySelectorAll('p');
            paragraphs.forEach((p) => {
                const textContent = p.textContent.trim();
                if (textContent.length > 50) {
                    articleBody += textContent + '\n\n';
                }
            });
        }
    } else if (hostname.includes('dnaindia.com')) {
        const container = document.querySelector('div.article-description');
        if (container) {
            const selectorsToRemove = [
                '.ads-box-300x250',
                '.ads-placeholder-internal',
                '[id^="taboola"]',
                '.trc_related_container',
                '#creInContentWidgetShow',
                '#creInContentWidget',
                '.recommended_widget',
                '.video_detail_heading',
                '.vdo_video_unit',
                '.vdo_embedd',
                '[id^="vdo_ai"]',
                'iframe',
                'video-js',
                'vdo',
            ];
            selectorsToRemove.forEach(selector => {
                container.querySelectorAll(selector).forEach(el => el.remove());
            });

         
            container.querySelectorAll('br').forEach(br => br.replaceWith('\n'));

          
            const paragraphs = Array.from(container.querySelectorAll('p'))
                .map(p => p.textContent.trim())
                .filter(text => text.length > 0 && !text.match(/^\(Except for the headline/)); 

            articleBody = paragraphs.join('\n\n');
        }
        } 
        else {

            
            const ps = document.querySelectorAll('article p');
            ps.forEach(p => { articleBody += p.textContent.trim() + '\n\n'; });
        }
        return { articleBody };
}










// Content script function to extract the title
function extractTitle() {
    const hostname = window.location.hostname;

    if (hostname.includes('hindustantimes.com')) {
        const titleElement = document.querySelector('h1.hdg1');
        return titleElement ? titleElement.textContent.trim() : null;

    } else if (hostname.includes('bbc.com')) {
        const titleElement = document.querySelector('h1.sc-737179d2-0.dAzQyd');
        return titleElement ? titleElement.textContent.trim() : null;

    } else if (hostname.includes('timesofindia.indiatimes.com')) {
        
        const titleElement = document.querySelector('h1.HNMDR');
        return titleElement ? titleElement.textContent.trim() : null;

    } else if (hostname.includes('dnaindia.com')) {
        const titleElement = document.querySelector('h1.article-heading');
        return titleElement ? titleElement.textContent.trim() : null;

    }  else {

        const titleElement = document.querySelector('h1.hdg1');
        return titleElement ? titleElement.textContent.trim() : null;
    }



}
