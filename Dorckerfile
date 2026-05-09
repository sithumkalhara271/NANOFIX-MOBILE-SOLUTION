
# Node.js මූලික කරගත් image එකක් ලබා ගැනීම
FROM node:18-slim

# Puppeteer සඳහා අවශ්‍ය කරන Linux dependencies ඉන්ස්ටෝල් කිරීම
RUN apt-get update && apt-get install -y \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libc6 \
    libcairo2 \
    libcups2 \
    libdbus-1-3 \
    libexpat1 \
    libfontconfig1 \
    libgbm1 \
    libgcc1 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libstdc++6 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxrandr2 \
    libxrender1 \
    libxss1 \
    libxtst6 \
    lsb-release \
    wget \
    xdg-utils \
    --no-install-recommends && \
    rm -rf /var/lib/apt/lists/*

# වැඩ කරන ඩිරෙක්ටරිය සකස් කිරීම
WORKDIR /app

# Package ෆයිල්ස් කොපි කිරීම
COPY package*.json ./

# අවශ්‍ය කරන packages ඉන්ස්ටෝල් කිරීම
RUN npm install

# සියලුම ෆයිල්ස් කොපි කිරීම
COPY . .

# බොට් එක ස්ටාර්ට් කරන කමාන්ඩ් එක (බොට් එක රන් වෙන්නේ index.js එකෙන් නම්)
CMD ["node", "index.js"]
