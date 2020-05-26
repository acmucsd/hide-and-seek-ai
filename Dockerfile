FROM python:3.7
FROM node:12.16.3

RUN mkdir /app
COPY ./server /app
WORKDIR /app

RUN bash ./setup.sh


# make api available
EXPOSE 9000

CMD ["pm2-runtime", "run.prod.js", "--time"]


# Test run cmd:
# docker run -p 9000:9000 stonezt2000/hide-and-seek-ai-backend