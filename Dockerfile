FROM python:3.7
FROM node:12.16.3

RUN mkdir /app
COPY ./server /app
WORKDIR /app

RUN bash ./setup.sh
RUN bash ./config.sh

# make api available
EXPOSE 9000

CMD ["pm2-runtime", "run.prod.js", "--output", "./logs/out.log", "--error", "./logs/err.log"]


# Test run cmd:
# docker run --name test -p 9000:9000 stonezt2000/hide-and-seek-ai-backend