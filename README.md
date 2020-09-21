# Cognito custom ui proxy

As many of you know, AWS Cognito doesn't allow much customization of their hosted ui, and no I18N at all.

This is a small serverless repo that uses a couple of lambdas to proxy exchanges with the cognito ui and rewrite the html when needed.

remember to add the environment variables in `env.yml`:

```
dev:
  PROXY_DOMAIN: mydomain.com (where the lambda will be deployed)
  COGNITO_DOMAIN: xxxx.xxxx.amazoncognito.com (cognito ui domain)
  COGNITO_ZONE: xxxxx (cognito zone)
  COGNITO_POOL_ID: xxxxx (cognito pull id)

```

You can customize the login page in index.html (uses doT.js for templating)
