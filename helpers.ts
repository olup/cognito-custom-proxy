process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

export const converter = ({
    cognitoDomain, localDomain
}) => {

    const toCognito = (string?: string) => {
        if (!string) return ""
        const regex = new RegExp(localDomain, "g")
        return string.replace(regex, cognitoDomain)
    }

    const toLocal = (string?: string) => {
        if (!string) return ""
        const regex = new RegExp(cognitoDomain, "g")
        return string.replace(regex, localDomain)
    }

    return { toCognito, toLocal }

}

export const thisConverter = converter({
    cognitoDomain: process.env.COGNITO_DOMAIN,
    localDomain: process.env.PROXY_DOMAIN
})

export const urlize = (domain: string) => "https://" + domain