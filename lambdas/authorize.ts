import { urlize, thisConverter } from "../helpers";
import { APIGatewayProxyHandler } from "aws-lambda";
import fetch from "node-fetch";

export const handler: APIGatewayProxyHandler = async (event, _context) => {
    const { prompt, ...query } = event.queryStringParameters || {}
    const queryString = Object.entries(query).map(([key, val]) => `${key}=${val}`).join('&');

    if (prompt == "select_account") {
        return {
            statusCode: 302,
            headers: { location: urlize(process.env.PROXY_DOMAIN) + "/login?" + queryString },
            body: ""
        };
    }

    const res = await fetch(urlize(process.env.COGNITO_DOMAIN) + "/authorize?" + queryString, {
        redirect: "manual", headers: {
            Cookie: thisConverter.toCognito(event.headers.Cookie)
        }
    })

    if (res.status == 302)
        res.headers.set("location", thisConverter.toLocal(res.headers.get("location")))

    return {
        statusCode: res.status,
        headers: Object.fromEntries(res.headers.entries()),
        body: await res.text(),
    };

}