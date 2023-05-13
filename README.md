> Based on & thanks to project [chatgpt-advanced](https://github.com/qunash/chatgpt-advanced) !

Rewrite the source of obtaining extension information below, do not retrieve webpage information from DuckDuckGo, but retrieve the returned information from a specified link (default http://127.0.0.1:8000, checkout this [project](https://github.com/pillipanda/embeddingDocProvideQuery) provide query about docs resp) for querying.

## Manual installation

  ℹ️ Don't forget to disable the extension installed from the Web Store while you're manually installed version.
  
  ### Chrome, Microsoft Edge, etc.
  1. Download the prebuilt chrome zip file from [here](build).
  2. Unzip the file.
  3. Open `chrome://extensions` in Chrome / `edge://extensions` in Microsoft Edge.
  4. Enable developer mode (top right corner).
  5. Click on `Load unpacked` and select the unzipped folder.
  6. Go to [ChatGPT](https://chat.openai.com/chat/) and enjoy!

## Build from source

1. `git clone https://github.com/qunash/chatgpt-advanced.git`
2. `npm install`
3. `npm run build-prod`
4. Grab your zip extension from `build/` folder
