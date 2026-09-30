FROM node:22-alpine AS dependencies
WORKDIR /app
COPY package*.json ./
RUN npm install --ignore-scripts

FROM dependencies AS build
ARG BACKEND_URL=http://backend:3000
ENV BACKEND_URL=$BACKEND_URL
COPY . .
RUN npm run build

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
COPY package*.json ./
RUN npm install --omit=dev --ignore-scripts
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
EXPOSE 3000
CMD ["npm", "start"]
