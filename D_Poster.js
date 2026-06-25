import fetch from 'node-fetch'
import dotenv from 'dotenv'
import { TwitterApi } from 'twitter-api-v2'
import { spawn } from 'child_process'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'
import { XMLParser } from 'fast-xml-parser'

dotenv.config()

const RSS_URL = 'https://stacker.news/~Design/rss'
const GIST_ID = process.env.GIST_ID
const GIST_FILENAME = 'posted.txt'
const GIST_TOKEN = process.env.GIST_TOKEN
const POST_INTERVAL_MS = parseInt(process.env.POST_INTERVAL_MS || '210000', 10)

// Debug: Check if GIST_ID and GIST_TOKEN are loaded
if (!GIST_ID || !GIST_TOKEN) {
  console.error('Missing GIST_ID or GIST_TOKEN!')
  console.error('GIST_ID:', GIST_ID)
  console.error('GIST_TOKEN:', GIST_TOKEN ? '[set]' : '[not set]')
  process.exit(1)
}

async function loadPostedCache() {
  const res = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
    headers: { Authorization: `token ${GIST_TOKEN}` }
  })
  if (!res.ok) throw new Error('Failed to fetch Gist')
  const data = await res.json()
  const content = data.files[GIST_FILENAME]?.content || ''
  return new Set(content.split('\n').map(l => l.trim()).filter(Boolean))
}

async function savePostedCache(postedSet) {
  const body = {
    files: {
      [GIST_FILENAME]: { content: Array.from(postedSet).join('\n') + '\n' }
    }
  }
  const res = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
    method: 'PATCH',
    headers: {
      Authorization: `token ${GIST_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  })
  if (!res.ok) throw new Error('Failed to update Gist')
}

async function getRSSItems() {
  const res = await fetch(RSS_URL)
  if (!res.ok) throw new Error(`RSS fetch failed: ${res.status} ${res.statusText}`)
  const xml = await res.text()
  const parser = new XMLParser({
    ignoreAttributes: false,
    isArray: (tagName) => tagName === 'item',
  })
  const data = parser.parse(xml)
  const items = data?.rss?.channel?.item || []
  return items.map(item => ({
    link: item?.guid?.trim() || null,
    title: item?.title?.trim() || null,
    author: item?.['atom:author']?.['atom:name']?.trim()
      || item?.author?.name?.trim()
      || 'Someone',
  })).filter(item => item.link && item.title)
}

function getRandomTwitterFormat({ title, link, author }) {
  const formats = [
    () => `\"${title}\" by ${author} — good stuff for anyone into design. ${link} #DesignTwitter`,
    () => `This one's worth a look — \"${title}\" by ${author}. Really nice thinking here. ${link} #DesignThinking`,
    () => `${author} shared \"${title}\" — interesting read for designers. ${link} #UIUX`,
    () => `\"${title}\" from ${author} caught my eye. Check it out. ${link} #GraphicDesign`,
    () => `Found this: \"${title}\" by ${author}. Always enjoy seeing what people create. ${link} #CreativeProcess`,
    () => `Just read \"${title}\" by ${author} — some solid insights. ${link} #WebDesign`,
    () => `\"${title}\" is a good one from ${author}. Worth a few minutes. ${link} #DesignTwitter`,
    () => `${author} posted \"${title}\" and honestly, it's really well done. ${link} #Typography`,
    () => `\"${title}\" from ${author}. Clean, thoughtful, worth sharing. ${link} #Branding`,
    () => `Liking \"${title}\" by ${author}. Solid perspective on design. ${link} #DesignThinking`,
    () => `${author} on Stacker News with \"${title}\" — nice read. ${link} #UIUX`,
    () => `\"${title}\" by ${author} — great design thinking in here. ${link} #GraphicDesign`,
    () => `${author} just dropped \"${title}\". Worth your time if you're into design. ${link} #DesignTwitter`,
    () => `Scrolling and found \"${title}\" by ${author}. Really liked this one. ${link} #CreativeProcess`,
    () => `\"${title}\" by ${author} — simple, clean, well done. ${link} #WebDesign`,
    () => `Digging \"${title}\" by ${author}. Really clean design thinking. ${link} #DesignTwitter`,
    () => `\"${title}\" from ${author} — this is the kind of design content I like seeing. ${link} #Typography`,
    () => `${author} with \"${title}\" — short read, good insights. ${link} #GraphicDesign`,
    () => `\"${title}\" by ${author}. Nice work, worth a look. ${link} #Branding`,
    () => `${author} writes about \"${title}\" — some great takeaways here. ${link} #DesignThinking`,
    () => `Spotted \"${title}\" by ${author} on Stacker News. Really enjoyed it. ${link} #UIUX`,
  ]
  return formats[Math.floor(Math.random() * formats.length)]()
}

function getRandomNostrFormat({ title, link, author }) {
  const formats = [
    () => `Came across \"${title}\" by ${author} on Stacker News and thought it was worth sharing. Great design thinking in this one. Check it out: ${link} #design #creativity #grownostr`,
    () => `${author} just shared \"${title}\" and it's a solid read for anyone into design. Always refreshing to see people put real thought into their work. ${link} #design #art #designstr`,
    () => `If you're into design, you'll want to see \"${title}\" by ${author}. Some really nice ideas and execution here. ${link} #creativity #nostr #design`,
    () => `Been reading \"${title}\" from ${author} — lots to take away from this one. Sharing for anyone interested in thoughtful design. ${link} #design #grownostr #creative`,
    () => `\"${title}\" by ${author} is one of those posts that makes you stop and think. Worth a read. ${link} #design #art #plebchain #creativity`,
    () => `Really enjoyed \"${title}\" by ${author}. Clean insights, well presented. This is the kind of content I love seeing. ${link} #design #grownostr #nostr`,
    () => `${author} dropped \"${title}\" and it's full of good ideas. If design is your thing, don't skip this one. ${link} #designstr #creativity #art`,
    () => `Some posts just hit different — \"${title}\" by ${author} is one of them. Great perspective on design. ${link} #design #grownostr #plebchain`,
    () => `\"${title}\" — a thoughtful piece from ${author}. Love seeing the design community share real, practical insights. ${link} #creativity #design #nostr`,
    () => `${author} wrote \"${title}\" and honestly it's one of the better design posts I've seen lately. Give it a look. ${link} #design #art #grownostr #designstr`,
    () => `Found a good one: \"${title}\" by ${author}. Really well thought out. Sharing it here for the design crowd. ${link} #design #creativity #nostr #plebchain`,
    () => `\"${title}\" from ${author} is worth your time. Clean design thinking, well presented. ${link} #art #designstr #grownostr`,
    () => `${author} posted \"${title}\" and it resonated. Good design always stands out. ${link} #design #grownostr #creativity #art`,
    () => `Reading through \"${title}\" by ${author} — some genuinely useful insights for designers. ${link} #design #nostr #designstr`,
    () => `\"${title}\" by ${author}. Solid work, worth sharing with this community. ${link} #plebchain #design #grownostr #creativity`,
    () => `Stumbled on \"${title}\" by ${author} and wanted to pass it along. Good design thinking never gets old. ${link} #design #creativity #grownostr`,
    () => `\"${title}\" from ${author} is a great example of thoughtful design. Really enjoyed this one. ${link} #art #designstr #nostr`,
    () => `${author} shared \"${title}\" and it's well worth your time. Clean, considered, well executed. ${link} #design #plebchain #grownostr`,
    () => `Reading \"${title}\" by ${author} — this is what good design looks like. Sharing for the creative minds here. ${link} #creativity #design #nostr #art`,
    () => `\"${title}\" by ${author} caught my attention. Some genuinely refreshing ideas in here. ${link} #design #grownostr #designstr`,
    () => `${author} on Stacker News with \"${title}\". Always appreciate when people share real design knowledge. ${link} #nostr #design #creativity`,
  ]
  return formats[Math.floor(Math.random() * formats.length)]()
}

async function postToTwitter({ title, link, author }) {
  if (!process.env.TWITTER_POSTER_API_KEY) return console.log('Twitter not configured')
  const client = new TwitterApi({
    appKey: process.env.TWITTER_POSTER_API_KEY,
    appSecret: process.env.TWITTER_POSTER_API_KEY_SECRET,
    accessToken: process.env.TWITTER_POSTER_ACCESS_TOKEN,
    accessSecret: process.env.TWITTER_POSTER_ACCESS_TOKEN_SECRET
  })
  
  const fullLink = link.endsWith('/r/deSign_r') ? link : link + '/r/deSign_r'
  let message = getRandomTwitterFormat({ title, link: fullLink, author })
  if (message.length > 280) message = message.slice(0, 277) + '...'
  await client.v2.tweet(message)
  console.log('Tweeted:', message)
}

async function postToNostr({ title, link, author }) {
  const __dirname = dirname(fileURLToPath(import.meta.url))
  const scriptPath = resolve(__dirname, 'nostr.py')
  const NOSTR_TIMEOUT_MS = parseInt(process.env.NOSTR_TIMEOUT_MS || '60000', 10)
  return new Promise((resolve, reject) => {
    const fullLink = link.endsWith('/r/deSign_r') ? link : link + '/r/deSign_r'
    const message = getRandomNostrFormat({ title, link: fullLink, author })
    const entry = JSON.stringify({
      title,
      link: fullLink,
      author,
      message,
      tags: [],
    })
    const py = spawn('python3', [scriptPath, entry])
    const timer = setTimeout(() => {
      py.kill()
      reject(new Error('nostr.py timed out'))
    }, NOSTR_TIMEOUT_MS)
    py.stdout.on('data', data => process.stdout.write(data))
    py.stderr.on('data', data => process.stderr.write(data))
    py.on('close', code => {
      clearTimeout(timer)
      if (code === 0) resolve()
      else reject(new Error('nostr.py failed'))
    })
  })
}

export async function runDBot() {
  const posted = await loadPostedCache()
  const items = await getRSSItems()

  for (const item of items) {
    if (!item.link || posted.has(item.link)) continue
    if (item.author?.toLowerCase() === 'design_r') {
      console.log(`Skipping @${item.author} post (bot owner): ${item.title}`)
      continue
    }
    let tweeted = false, nostrPosted = false
    try {
      await postToTwitter({ title: item.title, link: item.link, author: item.author })
      tweeted = true
    } catch (e) {
      if (e?.data?.detail?.includes('duplicate')) {
        console.log('Duplicate tweet, skipping X:', item.link)
      } else {
        console.error('Twitter error:', e)
      }
    }
    try {
      await postToNostr({ title: item.title, link: item.link, author: item.author })
      nostrPosted = true
    } catch (e) {
      console.error('Nostr error:', e)
    }
    if (tweeted || nostrPosted) {
      posted.add(item.link)
      await savePostedCache(posted)
    }
    await new Promise(res => setTimeout(res, POST_INTERVAL_MS))
  }
  console.log('✅ Done.')
}

if (process.argv[1].includes('D_Poster.js')) {
  runDBot()
}
