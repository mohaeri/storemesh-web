FROM nginx:1.29-alpine
COPY index.html style.css *.js /usr/share/nginx/html/
EXPOSE 80
