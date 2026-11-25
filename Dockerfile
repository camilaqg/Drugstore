# Imagen del frontend Angular (SSR) para el VPS.
#
# Dos etapas: el build de Angular corre con las dependencias de desarrollo y la
# imagen final se queda solo con el resultado y las dependencias de producción
# (express, que es lo que usa el servidor SSR).
FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# `ng build` usa la configuración production: fileReplacements mete
# environment.prod.ts, donde apiUrl es /api (mismo origen, detrás de nginx).
RUN npx ng build

FROM node:22-alpine

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000

COPY --from=build /app/dist ./dist
COPY --from=build /app/package.json /app/package-lock.json ./

RUN npm ci --omit=dev && npm cache clean --force

EXPOSE 4000

CMD ["node", "dist/drugstore-system/server/server.mjs"]
