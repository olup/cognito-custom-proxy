import { APIGatewayProxyHandler } from "aws-lambda";
import fetch from "node-fetch";
import { urlize, thisConverter } from "../helpers";

export const handler: APIGatewayProxyHandler = async (event, _context) => {
    const query = event.queryStringParameters
    const queryString = Object.entries(query).map(([key, val]) => `${key}=${val}`).join('&');

    const res = await fetch(urlize(process.env.COGNITO_DOMAIN) + "/logout?" + queryString, {
        redirect: "manual",
        headers: { cookie: thisConverter.toCognito(event.headers.Cookie) }
    }
    );

    const setCookie = res.headers.raw()["set-cookie"]?.map(c => thisConverter.toLocal(c)) || []

    console.log(res.headers.get("location"))

    return {
        statusCode: res.status,
        headers: { location: thisConverter.toLocal(res.headers.get("location")) || "" },
        multiValueHeaders: {
            "Set-Cookie": setCookie
        },
        body: await res.text()
    };

}
