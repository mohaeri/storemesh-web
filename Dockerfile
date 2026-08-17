FROM nginx:1.29-alpine
COPY index.html app.js style.css /usr/share/nginx/html/
EXPOSE 80
