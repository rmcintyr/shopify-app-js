# shopify-app-session-storage-dynamodb

Custom Shopify Session Store backed by DynamoDB

This provider is intended for use primarily with serverless implementations using lambda but could also be leveraged from EC2, ECS or other compute types with the appropriate IAM roles.

In development mode, or when using other compute types, you will need to ensure that appropriate credentials are provided or configured in your environment.  Alternatively, you may use serverless-dynamodb-local for development purposes.

Note that to reduce the size of deployed lambda functions, the aws-sdk module is intentionally included as a development dependency only.  If you require the full aws-sdk in another deployment target (e.g. Docker on fly.io) you will need to import aws-sdk into your project's runtime dependencies.

This provider implementation will create a new DynamoDB table named ShopifySessions if it is not initialized, and cannot find an existing table with that name in the account/region.

