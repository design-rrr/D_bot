# D_Bot 🤖 
`v2.1`

A Node.js + Python bot that cross-posts design content from [Stacker News ~Design](https://stacker.news/~Design/r/deSign_r) to [Twitter (X)](https://x.com/DeSign__r) and [Nostr](https://iris.to/deSign_r), with human-friendly messaging and separate templates per platform.

![75659 copy](https://github.com/user-attachments/assets/6de4e3eb-5c98-4149-813e-090f3ed59c23)

## 🚀 Features

- **Multi-Platform Posting**: Automatically posts to Twitter and Nostr with platform-specific templates
- **Stacker News Integration**: Monitors Stacker News ~Design sub-community via RSS
- **Scheduled Updates**: Runs on GitHub Actions cron (default: every 3 hours)
- **Bot Owner Filter**: Automatically skips posts by @deSign_r to avoid self-sharing
- **Human-Friendly Templates**: Separate pools of 21 hand-written templates per platform, using relevant hashtags
- **XML Parsing**: Proper RSS parsing with `fast-xml-parser` instead of fragile regex
- **Timeout Handling**: Configurable timeout for Nostr publishing (default 60s)
- **Error Resilience**: Gracefully handles Twitter rate limits, duplicate tweets, and network failures

## 📋 Prerequisites

Before running D_Bot, you'll need:

- Node.js (v18 or higher)
- Twitter API v2 credentials (API Key, API Secret, Access Token, Access Token Secret)
- Nostr private key for posting. get yours from [Nstart.me](https://nstart.me/)

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/design-rrr/D_Bot.git
   cd D_Bot
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory:
   ```env
   # Twitter API Credentials
   TWITTER_POSTER_API_KEY=your_api_key
   TWITTER_POSTER_API_KEY_SECRET=your_api_secret
   TWITTER_POSTER_ACCESS_TOKEN=your_access_token
   TWITTER_POSTER_ACCESS_TOKEN_SECRET=your_access_token_secret

   # GitHub Gist (for cross-run dedup) https://gist.github.com/design-rrr/063424572d66de647fa17d791bae5617
   GIST_ID=063424572d66de647fa17d791bae5617
   GIST_TOKEN=your_token_here

   # Nostr Configuration
   NOSTR_PRIVATE_KEY=your_nostr_private_key

   # Optional: post interval in ms (default 210000)
   # POST_INTERVAL_MS=210000

   # Optional: Nostr subprocess timeout in ms (default 60000)
   # NOSTR_TIMEOUT_MS=60000

   # Optional: npm registry mirror (for GitHub Actions in China)
   # NPM_REGISTRY_MIRROR=https://registry.npmmirror.com
   ```

## 🏃‍♂️ Running the Bot

### Local Development
```bash
node D_Poster.js
```

### Production Deployment
The bot is configured for deployment with the following settings:
- **Build Command**: `npm install`
- **Start Command**: `node D_Poster.js`
- **Environment**: Node.js

## 📁 Project Structure

```
D_Bot/
├── D_Poster.js          # Main application (Node.js)
├── nostr.py             # Nostr publishing module (Python)
├── package.json         # Node.js dependencies
├── requirements.txt     # Python dependencies
├── posted.txt           # Local cache of posted links
├── .env                 # Environment variables (not in repo)
├── .github/workflows/   # GitHub Actions CI/CD
└── README.md            # This file
```

## 🔧 Configuration

### Twitter API Setup
1. Create a Twitter Developer account
2. Create a new app in the Twitter Developer Portal
3. Generate API keys and tokens
4. Add credentials to your environment variables

### Nostr Setup
1. Generate a Nostr private key
2. Add the private key to your environment variables
3. The bot will automatically derive the public key

### Rate Limits
- **Twitter Basic Plan**: 17 tweets per 24 hours
- **Twitter Basic Paid**: 10,000 tweets per month
- The bot includes automatic error handling

## 📊 How It Works

1. **Monitoring**: Fetches the Stacker News ~Design RSS feed
2. **Filtering**: Skips already-posted items and posts authored by @deSign_r
3. **Processing**: Extracts post title, author, and link via XML parser
4. **Templating**: Picks a random human-friendly template — short for Twitter (1 hashtag), conversational for Nostr (3–4 hashtags)
5. **Cross-posting**: Posts to Nostr via Python subprocess, then to Twitter (if configured)
6. **Persistence**: Saves posted links to a GitHub Gist to avoid repeats across runs
7. **Pacing**: Waits `POST_INTERVAL_MS` between posts (default 3.5 min)


## ⚠️ Common Issues

### Python Subprocess Timeout
If Nostr publishing hangs:
- Check `NOSTR_TIMEOUT_MS` env var (default 60s)
- The bot will kill and retry on timeout

### Twitter Rate Limits
- Free tier: 17 requests per 24 hours
- Consider upgrading your Twitter API plan for higher limits
- The bot will continue posting to Nostr even when Twitter is rate limited

### Posts by @deSign_r Not Being Shared
This is intentional — the bot skips posts where the author matches `deSign_r` to avoid sharing your own content. Remove the check in `D_Poster.js:164` if you want to disable this.

## 🚀 Deployment

1. **Configure Service**:
   - **Environment**: Node.js
   - **Build Command**: `npm install`
   - **Start Command**: `node D_Poster.js`
2. **Set Environment Variables**: Add all required API keys and tokens


## 📈 Monitoring

The bot provides console logging for:
- Successful posts to each platform
- Rate limit notifications
- Error messages and debugging info
- Post status for each platform

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

If you encounter issues:
1. Check the console logs for error messages
2. Verify all environment variables are set correctly
3. Ensure API credentials are valid and have proper permissions
4. Check rate limits on your Twitter API plan

## 🔗 Related Links

- [Stacker News](https://stacker.news/r/deSign_r)
- [Twitter API Documentation](https://developer.twitter.com/en/docs)
- [Nostr Protocol](https://nostr.com)


---

Built with ❤️ for the design community
