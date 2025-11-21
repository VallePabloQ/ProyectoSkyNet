FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

# Exponemos el puerto de Vite
EXPOSE 5173

# Ejecutamos Vite permitiendo acceso desde fuera del contenedor (--host)
CMD ["npm", "run", "dev", "--", "--host"]