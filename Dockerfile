# Node.js version එක තෝරා ගැනීම (ඔබේ log එකේ තිබූ පරිදි 20 භාවිතා කිරීම වඩාත් සුදුසුයි)
FROM node:20-slim

# මෘදුකාංග ස්ථාපනයට අවශ්‍ය environment variables
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable

# පද්ධතියට අවශ්‍ය ලයිබ්‍රරි සහ Git ස්ථාපනය කිරීම
RUN apt-get update && apt-get install -y \
    git \
    wget \
    gnupg \
    ca-certificates \
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
    xdg-utils \
    && rm -rf /var/lib/apt/lists/*

# වැඩ කරන තැන (Working directory) සකස් කිරීම
WORKDIR /app

# Package ෆයිල්ස් කොපි කිරීම
COPY package*.json ./

# npm update කිරීම සහ dependencies install කිරීම
RUN npm install -g npm@latest
RUN npm install

# මුළු කේතයම (source code) කොපි කිරීම
COPY . .

# බොට් ආරම්භ කිරීම
CMD ["node", "index.js"]
