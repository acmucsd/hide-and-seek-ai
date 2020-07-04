FROM python:3.7
FROM node:12.16.3

RUN mkdir /app
COPY ./server/setup.sh /app
WORKDIR /app

RUN bash ./setup.sh
COPY ./server/ ./
RUN bash ./config.sh

RUN bash ./download-packages.sh

RUN mkdir hide_and_seek_official_tournament

# make api available
EXPOSE 9000
RUN chmod +x ./entrypoint.sh
CMD ["/bin/bash", "./entrypoint.sh"]