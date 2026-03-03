FROM node:18-alpine

# Install bash and other utilities
RUN apk add --no-cache bash procps

WORKDIR /app

# Copy all seller directories
COPY openclaw-acp-mns/ ./openclaw-acp-mns/
COPY openclaw-acp-mchan/ ./openclaw-acp-mchan/
COPY openclaw-acp-whalewatch/ ./openclaw-acp-whalewatch/
COPY acp-telegram-bot/ ./acp-telegram-bot/
COPY start.sh ./start.sh

# Install dependencies for each seller (--no-scripts skips husky postinstall)
RUN cd openclaw-acp-mns && npm install --omit=dev --no-scripts && cd /app
RUN cd openclaw-acp-mchan && npm install --omit=dev --no-scripts && cd /app
RUN cd openclaw-acp-whalewatch && npm install --omit=dev --no-scripts && cd /app
RUN cd acp-telegram-bot && npm install --omit=dev --no-scripts && cd /app

# Make start script executable
RUN chmod +x /app/start.sh

# Environment variables (overridable via Railway)
ENV TELEGRAM_BOT_TOKEN=8550561605:AAHeVdFAMsCR5-Vxq2277cj0wl3jULuLPAo
ENV TELEGRAM_CHAT_ID=74318760
ENV NODE_ENV=production

CMD ["/bin/bash", "/app/start.sh"]
