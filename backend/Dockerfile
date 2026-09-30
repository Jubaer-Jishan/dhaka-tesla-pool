FROM node:22-alpine AS dependencies
WORKDIR /app
COPY package*.json ./
RUN npm install --ignore-scripts

FROM dependencies AS build
COPY . .
RUN npm run build

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm install --omit=dev --ignore-scripts
COPY --from=build /app/dist ./dist
EXPOSE 3000
CMD ["sh", "-c", "npm run migration:run:prod && npm run start:prod"]
