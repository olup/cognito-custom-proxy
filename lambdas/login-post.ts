import { APIGatewayProxyHandler } from "aws-lambda";
import fetch from "node-fetch";
import { thisConverter, urlize } from "../helpers";

export const handler: APIGatewayProxyHandler = async (event, _context) => {
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
