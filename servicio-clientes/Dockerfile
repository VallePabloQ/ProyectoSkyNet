# Usamos una versión ligera de Node.js
FROM node:18-alpine

# Creamos la carpeta de trabajo
WORKDIR /app

# Copiamos los archivos de configuración primero (para aprovechar caché)
COPY package*.json ./

# Instalamos las dependencias
RUN npm install

# Copiamos el resto del código
COPY . .

# Exponemos el puerto (OJO: Esto es informativo, Railway lo detecta)
EXPOSE 3000

# Comando para iniciar
CMD ["npm", "run", "dev"]