#!/usr/bin/env bash
# exit on error
set -o errexit

npm install
# මෙන්න මේ ලයින් එකෙන් තමයි බ්‍රවුසරය ඉන්ස්ටෝල් කරන්නේ
npx puppeteer browsers install chrome

