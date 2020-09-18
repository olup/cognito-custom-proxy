import { APIGatewayProxyHandler } from 'aws-lambda';
import 'source-map-support/register';
import fetch from "node-fetch"
import { readFileSync } from "fs"
import { template } from "dot"

const COGNITO_URL = "https://testolup.auth.us-east-1.amazoncognito.com"
const COGNITO_DOMAIN = COGNITO_URL.replace("https://", "")

const LOCAL_DOMAIN = "9ab0fee068d9.ngrok.io"
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

export const authorize: APIGatewayProxyHandler = async (event, _context) => {
  const query = event.queryStringParameters
  const queryString = Object.entries(query).map(([key, val]) => `${key}=${val}`).join('&');
  const res = await fetch(COGNITO_URL + "/authorize?" + queryString, {
    redirect: "manual", headers: {
      Cookie: event.headers.Cookie
    }
  })

  if (res.status == 302)
    res.headers.set("location", res.headers.get("location").replace(COGNITO_URL, ""))

  return {
    statusCode: res.status,
    headers: Object.fromEntries(res.headers.entries()),
    body: await res.text(),

  };

}


export const login: APIGatewayProxyHandler = async (event, _context) => {
  const html = template(readFileSync("./templates/form.html").toString())

  const query = event.queryStringParameters
  const queryString = Object.entries(query).map(([key, val]) => `${key}=${val}`).join('&');
  const res = await fetch(COGNITO_URL + "/login?" + queryString);

  const cookie = Object.fromEntries(res.headers.get("set-cookie").split('; ').map(c => {
    const [key, ...v] = c.split('=');
    return [key, v.join('=')];
  }));

  const csrf = cookie["XSRF-TOKEN"]

  return {
    statusCode: 200,
    headers: { "content-type": "text/html", "set-cookie": res.headers.get("set-cookie") },
    multiValueHeaders: {
      "Set-Cookie": res.headers.get("set-cookie").split(";").map(c => c.replace(COGNITO_DOMAIN, LOCAL_DOMAIN))
    },
    body: html({ csrf, queryString }),
  };

}

export const postLogin: APIGatewayProxyHandler = async (event, _context) => {
  console.log(event)

  const query = event.queryStringParameters
  const queryString = Object.entries(query).map(([key, val]) => `${key}=${val}`).join('&');

  const res = await fetch(COGNITO_URL + "/login?" + queryString, {
    "method": "POST",
    redirect: "manual",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      "cookie": event.headers.Cookie
    },
    body: event.body
  }
  );

  const html = await res.text()

  console.log(res.status)

  // const cookie = Object.fromEntries(res.headers.get("set-cookie").split('; ').map(c => {
  //   const [key, ...v] = c.split('=');
  //   return [key, v.join('=')];
  // }));

  // const csrf = cookie["XSRF-TOKEN"]

  console.log(Object.fromEntries(res.headers.entries()))

  return {
    statusCode: res.status,
    headers: {
      location: res.headers.get("location").replace(COGNITO_URL, ""),
    },
    multiValueHeaders: {
      "Set-Cookie": res.headers.get("set-cookie").split(";").map(c => c.replace(COGNITO_DOMAIN, LOCAL_DOMAIN))
    },
    body: html,
  };

}
