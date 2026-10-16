FROM nginx:stable-alpine
RUN sed -i 's/^worker_processes.*/worker_processes 2;/' /etc/nginx/nginx.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY index.html styles.css app.js robots.txt sitemap.xml /usr/share/nginx/html/
COPY ventanas-vidrio-lima/ /usr/share/nginx/html/ventanas-vidrio-lima/
COPY vidrios-edificios-lima/ /usr/share/nginx/html/vidrios-edificios-lima/
COPY vidrios-remodelaciones-lima/ /usr/share/nginx/html/vidrios-remodelaciones-lima/
COPY assets/ /usr/share/nginx/html/assets/
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 CMD wget -q -O /dev/null http://127.0.0.1/health || exit 1
