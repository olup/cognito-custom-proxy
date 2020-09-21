import { APIGatewayProxyHandler } from "aws-lambda";
import fetch from "node-fetch";
import { urlize } from "../helpers";

export const handler: APIGatewayProxyHandler = async (_, _context) => {

    const discoveryData = await fetch(`https://cognito-idp.${process.env.COGNITO_ZONE}.amazonaws.com/${process.env.COGNITO_POOL_ID}/.well-known/openid-configuration`).then(r => r.json())

    discoveryData["authorization_endpoint"] = urlize(process.env.PROXY_DOMAIN) + "/authorize"
    discoveryData["end_session_endpoint"] = urlize(process.env.PROXY_DOMAIN) + "/logout"


    return {
        statusCode: 200,
        body: JSON.stringify(discoveryData)
    };
}
