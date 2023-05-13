import cheerio from 'cheerio'
import Browser from 'webextension-polyfill'


const BASE_URL = 'https://lite.duckduckgo.com'
const NEW_BASE_URL = 'http://127.0.0.1:8000'

export interface SearchRequest {
    query: string
    timerange: string
    region: string
    amount: number
}

export interface SearchResponse {
    status: number
    html: string
    url: string
}

export interface SearchResult {
    title: string
    body: string
    url: string
}

export async function getQueryComplete({ query, amount }: SearchRequest): Promise<SearchResponse> {
    const headers = {'Content-Type': 'application/json'}
    const body = {content: query, require_chunk_amount: amount}
    const response = await fetch(`${NEW_BASE_URL}/get_query_about_papers`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
    })

    if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`)
    }

    return { status: response.status, html: await response.json(), url: response.url }
}

export async function getHtml({ query, timerange, region }: SearchRequest): Promise<SearchResponse> {

    const formData = new URLSearchParams({
        q: query.slice(0, 495), // DDG limit
        df: timerange,
        kl: region,
    })

    const headers = {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'text/html,application/xhtml+xml,application/xmlq=0.9,image/avif,image/webp,image/apng,*/*q=0.8,application/signed-exchangev=b3q=0.7',
        AcceptEncoding: 'gzip, deflate, br',
        // 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0 Win64 x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36',
        // Cookie: `kl=${search.region} df=${search.timerange}`,
    }

    const response = await fetch(`${BASE_URL}/lite/`, {
        method: 'POST',
        headers,
        body: formData.toString(),
    })

    if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`)
    }

    return { status: response.status, html: await response.text(), url: response.url }
}

function htmlToSearchResults(html: string, numResults: number): SearchResult[] {
    // console.log("htmlToSearchResults", numResults)
    const $ = cheerio.load(html)
    const results: SearchResult[] = []

    const numTables = $('table').length

    if (!numTables) return results

    // Extract zero-click info, if present
    const zeroClickLink = $(`table:nth-of-type(${numTables-1}) tr td a[rel="nofollow"]`).first()
    if (zeroClickLink.length > 0) {
        results.push({
            title: zeroClickLink.text(),
            body: $('table:nth-of-type(2) tr:nth-of-type(2)').text().trim(),
            url: zeroClickLink.attr('href') ?? '',
        })
    }

    // Extract web search results
    const upperBound = zeroClickLink.length > 0 ? numResults - 1 : numResults
    const webLinks = $(`table:nth-of-type(${numTables}) tr:not(.result-sponsored) .result-link`).slice(0, upperBound)
    const webSnippets = $(`table:nth-of-type(${numTables}) tr:not(.result-sponsored) .result-snippet`).slice(0, upperBound)
    webLinks.each((i, element) => {
        const link = $(element)
        const snippet = $(webSnippets[i]).text().trim()

        results.push({
            title: link.text(),
            body: snippet,
            url: link.attr('href') ?? '',
        })
    })

    return results
}

export async function webSearch(search: SearchRequest, numResults: number): Promise<SearchResult[]> {
    const response: SearchResponse = await Browser.runtime.sendMessage({  // 向扩展程序的后台脚本发送消息。用于实现扩展程序中各个组件之间的通信。例如，可以在内容脚本中使用该方法向后台脚本发送消息，以便请求数据或执行某些操作。在后台脚本中，可以使用 Browser.runtime.onMessage 事件监听器来接收消息，并根据消息内容执行相应的操作。通过消息传递，扩展程序的不同组件之间可以共享数据、协调操作，并实现更复杂的功能。
        type: "get_search_results",
        search
    })

    let results: SearchResult[]
    if (response.url === `${BASE_URL}/lite/`) {
        results = htmlToSearchResults(response.html, numResults)
    } else {
        const result = await Browser.runtime.sendMessage({
            type: "get_webpage_text",
            url: response.url,
            html: response.html
        })

        return [{
            title: result.title,
            body: result.body,
            url: response.url
        }]
    }

    return results
}

export async function completeQueryPaperSearch(search: SearchRequest): Promise<string> {
    const response: SearchResponse = await Browser.runtime.sendMessage({  // 向扩展程序的后台脚本发送消息。用于实现扩展程序中各个组件之间的通信。例如，可以在内容脚本中使用该方法向后台脚本发送消息，以便请求数据或执行某些操作。在后台脚本中，可以使用 Browser.runtime.onMessage 事件监听器来接收消息，并根据消息内容执行相应的操作。通过消息传递，扩展程序的不同组件之间可以共享数据、协调操作，并实现更复杂的功能。
        type: "complete_query_paper",
        search
    })
    return response.html
}
