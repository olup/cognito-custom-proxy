import { APIGatewayProxyHandler } from "aws-lambda"
import { template } from "dot"
import { readFileSync } from "fs"
import { parse } from "tough-cookie"
import fetch from "node-fetch"
import { thisConverter, urlize } from "../helpers"

export const handler: APIGatewayProxyHandler = async (event, _context) => {
    const html = template(readFileSync("./templates/index.html").toString())

    const requestCookies = event.headers.Cookie?.split(";")?.map(c => parse(c)) || []
    const errorMessagesB64 = requestCookies.find(c => c.key === "cognito-fl")?.value
    const errorMessagesJSON = errorMessagesB64 ? (new Buffer(errorMessagesB64, 'base64')).toString() : null
    const errorMessages = JSON.parse(errorMessagesJSON)?.filter(m => m.targetRequestPath === "login")

    const reqCsrf = requestCookies.find(c => c.key === "XSRF-TOKEN")?.value

    const query = event.queryStringParameters
    const queryString = Object.entries(query).map(([key, val]) => `${key}=${val}`).join('&');

    const res = await fetch(urlize(process.env.COGNITO_DOMAIN) + "/login?" + queryString, {
        redirect: "manual", headers: {
            Cookie: thisConverter.toCognito(event.headers.Cookie)
        }
    });

    const setCookie = res.headers.raw()["set-cookie"]?.map(c => thisConverter.toLocal(c)) || []

    const setCookieDecoded = setCookie.map(c => parse(c))
    const csrf = setCookieDecoded.find(c => c.key === "XSRF-TOKEN")?.value || reqCsrf

    let isLogedIn = false;
    let user = ""

    if (requestCookies.find(c => c.key === "cognito")) {
        const text = await res.text()
        const match = /In as (.*)?<\/span/g.exec(text)
        user = match?.[1]
        if (user) isLogedIn = true
    }

    return {
        statusCode: 200,
        headers: { "content-type": "text/html" },
        multiValueHeaders: {
            "Set-Cookie": setCookie
        },
        body: html({ csrf, queryString, errorMessage: errorMessages?.[0], isLogedIn, user }),
    };
}

export const postLogin: APIGatewayProxyHandler = async (event, _context) => {
    const query = event.queryStringParameters
    const queryString = Object.entries(query).map(([key, val]) => `${key}=${val}`).join('&');

    const res = await fetch(urlize(process.env.COGNITO_DOMAIN) + "/login?" + queryString, {
        "method": "POST",
        redirect: "manual",
        headers: {
            "content-type": "application/x-www-form-urlencoded",
            "cookie": thisConverter.toCognito(event.headers.Cookie)
        },
        body: event.body
    }
    );


    const setCookie = res.headers.raw()["set-cookie"]?.map(c => thisConverter.toLocal(c)) || []


    return {
        statusCode: res.status,
        headers: { location: thisConverter.toLocal(res.headers.get("location")) || "" },
        multiValueHeaders: {
            "Set-Cookie": setCookie
        },
        body: await res.text()
    };

}