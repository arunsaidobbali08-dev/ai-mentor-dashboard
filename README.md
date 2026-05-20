# AI Mentor Dashboard

Static dashboard plus a small local OpenAI API bridge.

## Run

PowerShell:

```powershell
$env:OPENAI_API_KEY="your_api_key_here"
npm start
```

Then open:

```text
http://localhost:3000
```

Optional:

```powershell
$env:OPENAI_MODEL="gpt-5"
$env:PORT="3000"
```

## Files

- `index.html` - dashboard layout
- `styles.css` - futuristic responsive UI
- `script.js` - avatar switching, typing animation, mentor question flow
- `server.js` - local API bridge using OpenAI Responses API
