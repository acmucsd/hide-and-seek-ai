FROM python:3.7
FROM node:12.16.3

RUN mkdir /app
COPY ./server /app
WORKDIR /app

RUN bash ./setup.sh
RUN bash ./config.sh

# make api available
EXPOSE 9000
RUN chmod +x ./entrypoint.sh
CMD ["/bin/bash", "./entrypoint.sh"]


# Test run cmd:
# docker run --name test -p 9000:9000 stonezt2000/hide-and-seek-ai-backend